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
      headers: {'x-access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF9jb2xsYWJvcmF0b3IiOjExLCJpYXQiOjE2ODg0NTA0NjUsImV4cCI6MTY4ODQ2NDg2NX0.ZuvGgYoi0p2pMcZ8sVSxqUS3W6-iTyyr-TVvGEepoCc'
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
  