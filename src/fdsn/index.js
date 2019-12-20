import * as utils from '../utils/index.js'
import core from '../core/index.js'

export class Client {

  constructor (baseURL) {
    this.baseURL = baseURL
  }

  getEvents (params) {
    return new Promise((resolve, reject) => {
      let driver = null
      if (params.format === undefined || params.format === 'xml') {
        driver = core.event.quakeml
      } else if (params.format === 'text') {
        driver = core.event.text
      } else {
        throw new Error(`Unsupported format: ${params.format}`)
      }
      utils.ajax({
        method: 'GET',
        url: `${this.baseURL}/fdsnws/event/1/query`,
        type: params.format === 'text' ? 'text' : 'document',
        args: params
      }).then(response => {
        resolve(driver.parse(response))
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }

  getStations (params) {
    if (params.format !== 'text') {
      throw new Error('The only supported format is "text"')
    }
    return new Promise((resolve, reject) => {
      let driver = core.station.text
      utils.ajax({
        method: 'GET',
        url: `${this.baseURL}/fdsnws/station/1/query`,
        type: params.format,
        args: params
      }).then(response => {
        resolve(driver.parse(response))
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }

  getStationsBulk (bulk) {
    return new Promise((resolve, reject) => {
      let driver = core.station.text
      let data = ['format=text', 'level=channel'].concat(bulk.map(([net, sta, loc, cha, t1, t2]) => {
        t1 = t1 instanceof Date ? t1.toISOString().slice(0, 19) : t1
        t2 = t2 instanceof Date ? t2.toISOString().slice(0, 19) : t2
        return `${net} ${sta} ${loc} ${cha} ${t1} ${t2}`
      })).join('\r\n')
      utils.ajax({
        method: 'POST',
        url: `${this.baseURL}/fdsnws/station/1/query`,
        type: 'text',
        data
      }).then(response => {
        resolve(driver.parse(response))
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }

  getWaveforms (params, updateCallback) {
    return new Promise((resolve, reject) => {
      utils.ajax({
        method: 'GET',
        url: `${this.baseURL}/fdsnws/dataselect/1/query`,
        type: 'arraybuffer',
        args: params
      }).then(response => {
        core.waveform.read(response, st => {
          resolve(st)
        }, updateCallback)
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }

  getWaveformsBulk (bulk, updateCallback) {
    return new Promise((resolve, reject) => {
      let data = bulk.map(([net, sta, loc, cha, t1, t2]) => {
        t1 = t1 instanceof Date ? t1.toISOString().slice(0, 19) : t1
        t2 = t2 instanceof Date ? t2.toISOString().slice(0, 19) : t2
        return `${net} ${sta} ${loc} ${cha} ${t1} ${t2}`
      }).join('\r\n')
      utils.ajax({
        method: 'POST',
        url: `${this.baseURL}/fdsnws/dataselect/1/query`,
        type: 'arraybuffer',
        data
      }).then(response => {
        core.waveform.read(response, st => {
          resolve(st)
        }, updateCallback)
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }

}
