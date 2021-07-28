import { AjaxOpt } from "../types"

export const ajax = (opt: AjaxOpt, xhr?: XMLHttpRequest) => {
  if (xhr == null) {
    xhr = new XMLHttpRequest()
  }
  return new Promise((resolve, reject) => {
    opt = Object.assign({
      method: 'GET', url: null, type: 'text', args: null, data: null, dataMimeType: null
    }, opt)
    if (opt.url == null) {
      throw new Error('"url" option is not defined')
    }
    opt.args = (
      opt.args == null ? ''
        : '?' + Object.entries(opt.args).map(x => `${x[0]}=${x[1]}`).join('&')
    )
    xhr.open(opt.method, opt.url + opt.args)
    xhr.responseType = opt.type
    xhr.onerror = () => reject(xhr)
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response)
      } else {
        reject(xhr)
      }
    }
    if (opt.method === 'POST' && opt.dataMimeType !== null) {
      xhr.setRequestHeader('Content-Type', opt.dataMimeType)
    }
    xhr.send(opt.data)
  })
}
