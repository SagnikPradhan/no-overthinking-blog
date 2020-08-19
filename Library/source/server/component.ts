import regexparam from 'regexparam'
import { Service, Request, Response } from './service'

export interface ServerComponentProps {
  path?: string[]
  service: Service
  children?: ServerComponent[]
}

const nonEmptyArray = <T extends unknown[]>(arr: T | undefined): arr is T => Boolean(arr && arr.length > 0)

export class ServerComponent {
  #path?: { keys: string[], pattern: RegExp }[]
  #service: Service
  #children: ServerComponent[]

  constructor({ path, service, children }: ServerComponentProps) {
    if (nonEmptyArray(path)) this.#path = path.map((p) => regexparam(p))

    this.#service = service
    this.#children = children || []
  }

  async execute({ url, request, response }: { url: string, request: Request, response: Response }): Promise<[Request, Response]> {
    if (nonEmptyArray(this.#path)) {
      const path = this.#path.find(({ pattern }) => pattern.test(url))
      if (!path) return [request, response];

      // If queries is not already populated
      if (nonEmptyArray(Object.keys(request.query))) {
        const queryValues = (path.pattern.exec(url) || []).slice(1)
        const query = Object.fromEntries(queryValues.map((v, i) => [path.keys[i], v]))
        Object.assign(request.query, query)
      }
    }

    let [servicesParsedRequest, servicesParsedResponse] = await this.#service(request, response)
    for (const child of this.#children)
      [servicesParsedRequest, servicesParsedResponse] = await child.execute({ url, request: servicesParsedRequest, response: servicesParsedResponse })

    return [servicesParsedRequest, servicesParsedResponse]
  }
}
