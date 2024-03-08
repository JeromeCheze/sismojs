import core from '../core'
import type { EventParameter, FDSNEventParams, FDSNStationBulkItem, FDSNStationParams, FDSNWaveformBulkItem, FDSNWaveformParams } from '../types/index.js'

export class Client {
  baseURL: string

  constructor (baseURL: string) {
    this.baseURL = baseURL
  }

  getEvents (params: FDSNEventParams) {
    if (params.format != null && params.format !== 'text' && params.format !== 'xml') {
      throw new Error(`Unsupported format: ${params.format}`)
    }
    return new Promise<EventParameter[]>((resolve, reject) => {
      const args = Object.entries(params).map(x => `${x[0]}=${x[1]}`).join('&')
      fetch(`${this.baseURL}/fdsnws/event/1/query?${args}`, {
        method: 'GET'
      }).then(response => {
        if (response.status === 200) {
          response.text().then(txt => {
            if (params.format === undefined || params.format === 'xml') {
              const doc = new DOMParser().parseFromString(txt, 'application/xml')
              resolve(core.event.quakeml.parse(doc))
            } else if (params.format === 'text') {
              resolve(core.event.text.parse(txt))
            }
          })
        } else {
          throw new Error(response.statusText)
        }
      }).catch(err => reject(err))
    })
  }

  getStations (params: FDSNStationParams) {
    if (params.format !== 'text') {
      throw new Error('The only supported format is "text"')
    }
    return new Promise((resolve, reject) => {
      const driver = core.station.text
      const args = Object.entries(params).map(x => `${x[0]}=${x[1]}`).join('&')
      fetch(`${this.baseURL}/fdsnws/station/1/query?${args}`, {
        method: 'GET'
      }).then(response => {
        if (response.status === 200) {
          if (params.format === 'text') {
            response.text().then(txt => {
              resolve(driver.parse(txt))
            })
          }
        } else {
          throw new Error(response.statusText)
        }
      }).catch(err => reject(err))
    })
  }

  getStationsBulk (bulk: FDSNStationBulkItem[]) {
    return new Promise((resolve, reject) => {
      const driver = core.station.text
      const data = ['format=text', 'level=channel'].concat(bulk.map(([net, sta, loc, cha, t1, t2]) => {
        t1 = t1 instanceof Date ? t1.toISOString().slice(0, 19) : t1
        t2 = t2 instanceof Date ? t2.toISOString().slice(0, 19) : t2
        return `${net} ${sta} ${loc} ${cha} ${t1} ${t2}`
      })).join('\r\n')
      fetch(`${this.baseURL}/fdsnws/station/1/query`, {
        method: 'POST',
        body: data,
        headers: { 'Content-Type': 'text/plain' }
      }).then(response => {
        if (response.status === 200) {
          response.text().then(txt => {
            resolve(driver.parse(txt))
          })
        } else {
          throw new Error(response.statusText)
        }
      }).catch(err => reject(err))
    })
  }

  getWaveforms (
    params: FDSNWaveformParams,
    updateCallback: (progression: number) => void,
    useWorker = true
  ) {
    return new Promise((resolve, reject) => {
      const args = Object.entries(params).map(x => `${x[0]}=${x[1]}`).join('&')
      fetch(`${this.baseURL}/fdsnws/dataselect/1/query?${args}`, {
        method: 'GET'
      }).then(response => {
        if (response.status === 200) {
          response.arrayBuffer().then((arr) => {
            if (useWorker) {
              core.waveform.readWithWorker(arr, st => {
                resolve(st)
              }, updateCallback)
            } else {
              core.waveform.read(arr, st => {
                resolve(st)
              }, updateCallback)
            }
          })
        } else {
          throw new Error(response.statusText)
        }
      }).catch(err => reject(err))
    })
  }

  getWaveformsBulk (
    bulk: FDSNWaveformBulkItem[],
    updateCallback: (progression: number) => void,
    signal?: AbortSignal,
    useWorker = true
  ) {
    return new Promise((resolve, reject) => {
      const data = bulk.map(([net, sta, loc, cha, t1, t2]) => {
        t1 = t1 instanceof Date ? t1.toISOString().slice(0, 19) : t1
        t2 = t2 instanceof Date ? t2.toISOString().slice(0, 19) : t2
        return `${net} ${sta} ${loc} ${cha} ${t1} ${t2}`
      }).join('\r\n')
      fetch(`${this.baseURL}/fdsnws/dataselect/1/query`, {
        method: 'POST',
        body: data,
        signal,
        headers: { 'Content-Type': 'text/plain' }
      }).then(response => {
        if (response.status === 200) {
          response.arrayBuffer().then(arr => {
            if (useWorker) {
              core.waveform.readWithWorker(arr, st => {
                resolve(st)
              }, updateCallback)
            } else {
              core.waveform.read(arr, st => {
                resolve(st)
              }, updateCallback)
            }
          })
        } else {
          throw new Error(response.statusText)
        }
      }).catch(err => reject(err))
    })
  }
}
