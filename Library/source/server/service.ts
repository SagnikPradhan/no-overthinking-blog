export interface Request {
  headers: Record<string, string>
  method: string
  body: unknown
  query: Record<string, unknown>
}

export interface Response {
  headers: Record<string, string>
  body: unknown
  statusCode: number
}

export type Service = (props: [Request, Response]) => Promise<[Request, Response]>
