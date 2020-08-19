import http from 'http'

import EventEmitter from 'eventemitter3'
import regexparam from 'regexparam'


export interface AppProps {
  port: number
}

export interface Response {
  headers: Record<string, string>
  body: unknown
  statusCode: number
}

export interface Request {
  headers: Record<string, string>
  body: unknown
  method: string
}

export function AppComponent({ port }: AppProps) {
  const events = new EventEmitter()
  const server = startServer().listen(port)
}

function startServer() {
  const server = http.createServer(() => {

  })

  return server;
}

type Service = (req: Request, res: Response) => Promise<Response>

export interface ServerComponentProps {
  path?: string
  service: Service
  nodes?: ServerComponent[]
}

export class ServerComponent {
  #service: Service
  #path?: { keys: string[], pattern: RegExp }

  public readonly nodes: ServerComponent[] = []

  constructor({ service, path, nodes }: ServerComponentProps) {
    this.#service = service
    if (path) this.#path = regexparam(path)
    this.nodes = nodes || []
  }

  public async runService(req: Request, res: Response): Promise<Response> {
    const currentServiceResponse = await this.#service(req, res)
    let response = currentServiceResponse

    for (const node of this.nodes)
      response = await node.runService(req, response)

    return response
  }
}
