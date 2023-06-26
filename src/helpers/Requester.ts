import Axios, { AxiosError, AxiosResponse } from "axios";


const requester = async <T>(
  {url, method = 'GET', data = {}, params = {}, extraHeaders = {}}: 
  {
    url:string, 
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    data?: unknown, 
    params?: unknown, 
    extraHeaders?: any
  }) => {
    return Axios({
      headers: {'x-access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF9jb2xsYWJvcmF0b3IiOjExLCJpYXQiOjE2ODc4MTM5NDgsImV4cCI6MTY4NzgyODM0OH0.DxRqgVO4MpadosuiTLhtL9Cbnly7jczWppRWLi9jvwc'
      // localStorage.getItem('hjN8wY5KBs3NWhGv')
      , ...extraHeaders },
      baseURL: import.meta.env.VITE_ENDPOINT,
      url,
      method,
      data,
      params
    })
    .then((res: AxiosResponse) => {
      return res.data
    })
    .catch((err: AxiosError) => {
      return err.response?.data
    })
  }

  export default requester;
  