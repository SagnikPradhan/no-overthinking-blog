import regexparam from 'regexparam'
import { Service, Request, Response } from './service'

export const emptyArray = <T extends unknown[]>(arr: T | undefined): arr is T => !Array.isArray(arr) || arr.length === 0

type RequestTreeNode = ({ url, req, res }: { url: string, req: Request, res: Response }) => Promise<[Request, Response]>

/**
 * Server Component
 * @param service - Service to be run
 * @param props - Properties
 */
export function ServerComponent<N extends RequestTreeNode[]>(service: Service, props?: {
  path?: string
  nodes?: N
}): RequestTreeNode {
  const path = props?.path ? regexparam(props.path) : null
  const nodes = props?.nodes || []

  return async ({ url, req, res }: {
    url: string,
    req: Request,
    res: Response
  }) => {
    // If path specific
    // Check if it runs on current path
    if (path?.pattern.test(url)) {

      // If queries are missing add them
      if (emptyArray(Object.keys(req.query))) {
        const queryValues = path.pattern.exec(url)?.slice(1) || []
        const query = Object.fromEntries(queryValues.map((v, i) => [path.keys[i], v]))
        req.query = query
      }

    } else return [req, res];

    // Run the current service
    let [request, response] = await service([req, res])

    // Run the nodes
    for (const node of nodes)
      [request, response] = await node({ url, req: request, res: response })

    return [req, res]
  }
}
