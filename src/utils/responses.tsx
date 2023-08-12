import { IRequest } from "../interfaces/interfaces"

const responseError:IRequest<undefined> = {
  code: 500,
  message: "Internal error",
  data: undefined
}

export {
  responseError
}