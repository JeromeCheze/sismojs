import * as utils from '../utils'
import core from '../core'
import { EventDriver, FDSNEventParams, FDSNStationBulkItem, FDSNStationParams, FDSNWaveformBulkItem, FDSNWaveformParams } from '../types/index.js'

export class Client {
  baseURL: string

  constructor (baseURL: string) {
    this.baseURL = baseURL
  }

  getEvents (params: FDSNEventParams) {
    return new Promise((resolve) => {
      let driver: EventDriver | null = null
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
        try {
          if (driver != null) {
            resolve(driver.parse(response))
          }
        } catch (error) {
          console.error(error)
        }
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }

  getStations (params: FDSNStationParams) {
    if (params.format !== 'text') {
      throw new Error('The only supported format is "text"')
    }
    return new Promise((resolve) => {
      const driver = core.station.text
      utils.ajax({
        method: 'GET',
        url: `${this.baseURL}/fdsnws/station/1/query`,
        type: params.format,
        args: params
      }).then(response => {
        resolve(driver.parse(<string>response))
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }

  getStationsBulk (bulk: FDSNStationBulkItem[]) {
    return new Promise((resolve) => {
      const driver = core.station.text
      const data = ['format=text', 'level=channel'].concat(bulk.map(([net, sta, loc, cha, t1, t2]) => {
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
        resolve(driver.parse(<string>response))
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }

  getWaveforms (
    params: FDSNWaveformParams,
    updateCallback: (progression: number) => void,
    useWorker = true
  ) {
    return new Promise((resolve, reject) => {
      utils.ajax({
        method: 'GET',
        url: `${this.baseURL}/fdsnws/dataselect/1/query`,
        type: 'arraybuffer',
        args: params
      }).then(response => {
        if (useWorker) {
          core.waveform.readWithWorker(<ArrayBuffer>response, st => {
            resolve(st)
          }, updateCallback)
        } else {
          core.waveform.read(<ArrayBuffer>response, st => {
            resolve(st)
          }, updateCallback)
        }
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }

  getWaveformsBulk (
    bulk: FDSNWaveformBulkItem[],
    updateCallback: (progression: number) => void,
    useWorker = true
  ) {
    return new Promise((resolve, reject) => {
      const data = bulk.map(([net, sta, loc, cha, t1, t2]) => {
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
        if (useWorker) {
          core.waveform.readWithWorker(<ArrayBuffer>response, st => {
            resolve(st)
          }, updateCallback)
        } else {
          core.waveform.read(<ArrayBuffer>response, st => {
            resolve(st)
          }, updateCallback)
        }
      }).catch(xhr => {
        throw new Error(xhr.statusText)
      })
    })
  }
}
