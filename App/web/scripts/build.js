// Imports
const rollup = require('rollup')
const yargs = require('yargs-parser')
const path = require('path')
const c = require('colorette')

// Rollup Plugins
const pluginCommonJS = require('@rollup/plugin-commonjs')
const pluginNodeResolve = require('@rollup/plugin-node-resolve').nodeResolve
const pluginTypescript = require('@rollup/plugin-typescript')
const pluginSucrase = require('@rollup/plugin-sucrase')
const pluginReplace = require('@rollup/plugin-replace')
const pluginLiveReload = require('rollup-plugin-livereload')
const pluginTerser = require('rollup-plugin-terser').terser

const { dependencies } = require('../package.json')

const root = (...args) => path.resolve(__dirname, '..', ...args)
const join = path.join

// Constants or Configuration
const dependenciesArr = Object.keys(dependencies)
const { DEV, TS, VERBOSE } = yargs(process.argv.slice(2), {
	alias: {
		DEV: ['dev', 'watch', 'd', 'w'],
		TS: ['typescript', 'ts'],
		VERBOSE: ['v', 'verbose'],
	},
	boolean: ['DEV', 'TS', 'VERBOSE'],
	default: { DEV: false, TS: false, VERBOSE: false },
})
const sourceEntryPoints = [root('source/app.tsx'), root('source/index.tsx')]

console.log('\033c')
if (VERBOSE)
	console.log(
		c.yellow('Current Configuration:\n'),
		` Development Mode - ${DEV}\n`,
		` Typescript Mode - ${TS || !DEV}\n`,
		` Source Entry Point - ${sourceEntryPoint}\n`
	)

if (DEV) developmentBuild().catch(errorHandler)
else productionBuild().catch(errorHandler)

async function productionBuild() {
	if (VERBOSE) console.log(c.yellow('Started Production Build'))

	const plugins = [
		pluginCommonJS(),
		pluginNodeResolve({
			extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx'],
			preferBuiltins: false,
		}),
		pluginTypescript({ tsconfig: root('tsconfig.json') }),
		pluginReplace({
			values: {
				'process.env.NODE_ENV': '"production"',
			},
		}),
		pluginTerser(),
	]

	const inputOptions = sourceEntryPoints.map((input) => ({
		input,
		context: 'window',
		plugins,
	}))

	const outputOptions = {
		dir: root('dist'),
		format: 'es',
		sourcemap: true,
	}

	console.time(c.greenBright('Completed Production Build'))
	const bundle = await rollup.rollup(inputOptions)
	await bundle.write(outputOptions)
	console.timeEnd(c.greenBright('Completed Production Build'))
}

async function developmentBuild() {
	if (VERBOSE) console.log(c.yellow('Started Development Build'))

	console.time(c.greenBright('Created Dependencies Bundle'))
	await createDependenciesBundle()
	console.timeEnd(c.greenBright('Created Dependencies Bundle'))

	if (VERBOSE) console.log(c.yellow('\nStarting Watch Mode'))
	await startWatchMode()

	async function createDependenciesBundle() {
		const plugins = [
			pluginCommonJS(),
			pluginNodeResolve({ preferBuiltins: false }),
			pluginReplace({
				values: {
					'process.env.NODE_ENV': '"development"',
				},
			}),
		]

		// Resolve es modules if available
		const getEntryPointPath = (name) => {
			const resolve = require.resolve
			const root = (...args) => join(name, ...args)

			const { main, module, type } = require(root('package.json'))

			// Add paths relative to packages root
			const ManualMap = {}

			// Preference
			// 1. main field, if module
			// 2. module field
			// 3. manually mapped paths
			// 4. main field
			const path = resolve(
				root(type === 'module' ? main : module || ManualMap[name] || main)
			)

			if (VERBOSE) console.log(`Using ${c.cyan(name)}:`, c.gray(path))
			return path
		}

		const inputOptions = {
			input: Object.fromEntries(
				dependenciesArr.map((name) => [name, getEntryPointPath(name)])
			),
			context: 'window',
			plugins,
		}

		const outputOptions = {
			dir: root('dist/dependencies'),
			format: 'es',
			entryFileNames: '[name].js',
			sourcemap: true,
			exports: 'named',
		}

		const bundle = await rollup.rollup(inputOptions)
		await bundle.write(outputOptions)
	}

	async function startWatchMode() {
		const plugins = [
			pluginJson(),
			pluginCommonJS(),
			pluginNodeResolve({
				extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx'],
				preferBuiltins: false,
			}),
			TS
				? pluginTypescript({ tsconfig: root('tsconfig.json') })
				: pluginSucrase({ transforms: ['typescript', 'jsx'] }),
			pluginServe({
				contentBase: root('public'),
				port: 5000,
				historyApiFallback: '/index.html',
			}),
			pluginLiveReload(root('public')),
		]

		const inputOptions = sourceEntryPoints.map((input) => ({
			input,
			context: 'window',
			plugins,
			external: dependenciesArr,
		}))

		const outputOptions = {
			dir: root('dist'),
			format: 'es',
			sourcemap: true,
			paths: Object.fromEntries(
				dependenciesArr.map((k) => [k, `./dependencies/${k}.js`])
			),
		}

		const watchOptions = { clearScreen: false }

		const watcher = rollup.watch({
			...inputOptions,
			output: [outputOptions],
			watch: watchOptions,
		})

		watcher.on('event', (event) => {
			const code = event.code

			if (code === 'BUNDLE_START') console.log(c.yellow('\nFound Changes'))
			else if (code === 'BUNDLE_END')
				console.log(
					c.greenBright(`Completed build: ${c.white(event.duration + 'ms')}`)
				)
			else if (code === 'ERROR') {
				throw new Error(event.error)
			} else if (VERBOSE) console.log(event)
			else return
		})
	}
}

function logError(error) {
	const { frame, loc, name, stack } = error

	// Random property that only exists on rollup errors
	if (!frame || VERBOSE) return console.error(error)

	console.log(c.red(frame))
	console.log(c.red(`In ${loc.file}`))

	// Just to remove useless props
	const smallerError = new Error(name)
	smallerError.stack = stack

	console.error(smallerError)
}

function errorHandler(err) {
	logError(err)
	if (!DEV) process.exit(1)
}
