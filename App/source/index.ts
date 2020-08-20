import { ServerComponent, Service } from '@app/library'

const service: Service = async ([request, response]) => {
  response.body = "Hello World"
  return [request, response]
}

export const serverComponent = ServerComponent(service, { path: '/' })
