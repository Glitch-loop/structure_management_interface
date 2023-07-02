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
      headers: {'x-access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF9jb2xsYWJvcmF0b3IiOjExLCJpYXQiOjE2ODgzMzczMzUsImV4cCI6MTY4ODM1MTczNX0.lmY22PtAlvPWbOYj_h86cSlHfr5kqhi-Zk0oSz5y3eg'
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
  