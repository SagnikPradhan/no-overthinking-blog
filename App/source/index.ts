import { ServerComponent } from '@app/library'

export default new ServerComponent({
  path: ["/"],
  service: async (_, response) => {
    response.body = "Hello World"
    return [_, response]
  }
})
