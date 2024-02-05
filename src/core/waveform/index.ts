import workerStr from './worker'
import type { Bloquette1000, FSDH, MSEEDHeader, MSEEDHeaderStrict, TraceConstructorParameters, TraceStats, TraceTimeserie, UpdateFunction } from '../../types'

export class Trace {
  timeseries: TraceTimeserie[]
  stats: TraceStats
  __tolerance: number

  constructor (opt: TraceConstructorParameters) {
    // This define a time tolerance (as a period ratio) for continuous traces
    const TOLERANCE = 0.005
    this.timeseries = opt.timeseries != null ? opt.timeseries : []
    if (opt.stats != null) {
      this.stats = opt.stats
    } else {
      if (opt.id == null || opt.samplingRate == null) {
        throw new Error('id and samplingRate parameters must be specified')
      }
      const [network, station, location, channel] = opt.id.split('.')
      this.stats = {
        id: opt.id,
        network,
        station,
        location,
        channel,
        samplingRate: opt.samplingRate,
        delta: 1.0 / opt.samplingRate,
        npts: 0,
        starttime: null,
        endtime: null
      }
    }
    this.__tolerance = 1e3 * TOLERANCE / this.stats.samplingRate
    if (opt.data) {
      for (const currData of opt.data) {
        this._addData(currData.starttime, currData.data)
      }
    }
  }

  get data () {
    if (this.timeseries.length === 0) {
      return []
    } else if (this.timeseries.length === 1) {
      return this.timeseries[0].data
    }
    let data = this.timeseries[0].data
    for (let i = 1; i < this.timeseries.length; i++) {
      const gapLength = (this.timeseries[i].starttime - this.timeseries[i - 1].endtime) / 1e3
      const nbSamples = Math.floor(gapLength * this.stats.samplingRate)
      if (nbSamples > 0) {
        const d = new Date()
        d.setTime(this.timeseries[i - 1].endtime)
        console.log(`${this.stats.id} : Warning: found gap of ${gapLength} seconds (${nbSamples}) | gap begin at ${d.toISOString()}`)
        for (let n = 0; n < nbSamples; n++) {
          data.push(null)
        }
      }
      data = data.concat(this.timeseries[i].data)
    }
    return data
  }

  _updateStats () {
    this.stats.starttime = this.timeseries[0].starttime
    this.stats.endtime = this.timeseries.slice(-1)[0].endtime
    this.stats.npts = (this.stats.endtime - this.stats.starttime) * this.stats.samplingRate
    return this
  }

  _addData (starttime: number, data: (number | null)[]) {
    const endtime = starttime + (data.length / this.stats.samplingRate) * 1e3
    if (this.timeseries.length === 0) {
      this.timeseries.push({ starttime, endtime, data })
      this.stats.starttime = starttime
      this.stats.endtime = endtime
      return this._updateStats()
    }
    // try to merge data to an existing timeseries
    for (const timeserie of this.timeseries) {
      if (Math.abs(timeserie.endtime - starttime) < this.__tolerance) {
        // put data at the end of the timeserie
        timeserie.data = timeserie.data.concat(data)
        timeserie.endtime = endtime
        return this._updateStats()
      } else if (Math.abs(endtime - timeserie.starttime) < this.__tolerance) {
        // put data at the start of the timeserie
        timeserie.data = data.concat(timeserie.data)
        timeserie.starttime = starttime
        return this._updateStats()
      }
    }
    // merge failed : create new timeseries at the right place
    for (const [i, timeserie] of this.timeseries.entries()) {
      if (starttime < timeserie.starttime) {
        // create timeserie before
        this.timeseries.splice(i, 0, { starttime, endtime, data })
        return this._updateStats()
      }
    }
    // create timeserie after
    this.timeseries.push({ starttime, endtime, data })
    return this._updateStats()
  }

  getOffset () {
    let allData: number[] = []
    let nbSamples = 0
    for (const timeserie of this.timeseries) {
      allData = allData.concat(<number[]>timeserie.data.filter(x => x != null))
      nbSamples += timeserie.data.length
    }
    return Math.floor(allData.reduce((x, y) => x + y) / nbSamples)
  }
}

export class Stream {
  ENCODING: (string | null)[]
  traces: Trace[]

  constructor (dv?: DataView, updateFunction?: UpdateFunction) {
    this.ENCODING = [
      'ASCII', 'INT16', 'INT24', 'INT32', 'IEEE', 'IEEE_2', // 0 -> 5
      null, null, null, null,
      'STEIM1', 'STEIM2', // 10 -> 11
      'GEOSCOPE_1', 'GEOSCOPE_2', 'GEOSCOPE_3', // 12 -> 14
      'US', 'CDSN', 'Graefenberg', 'IPG', // 15 -> 18
      'STEIM3', // 19
      null, null, null, null, null, null, null, null, null, null,
      'SRO', 'HGLP', 'DWWSSN', 'RSTN' // 30 -> 33
    ]
    this.traces = []
    if (dv) {
      this.parseMSEED(dv, updateFunction)
    }
  }

  signedInt (value: number, size: number) {
    const mask = Math.pow(2, size) - 1
    value &= mask
    return value >> (size - 1) ? -1 * (~value & mask) - 1 : value
  }

  dataViewString (dv: DataView, offset: number, len: number) {
    const result = new Array(len)
    for (let i = 0; i < len; i++) {
      result[i] = String.fromCharCode(dv.getUint8(offset + i))
    }
    return result.join('')
  }

  getTrace (id: string) {
    for (const trace of this.traces) {
      if (trace.stats.id === id) {
        return trace
      }
    }
  }

  decodeFSDH (dv: DataView, o: number, byteorder: boolean): FSDH {
    const tmp = new Date()
    tmp.setTime(Date.UTC(
      dv.getUint16(o + 20, byteorder), // year
      0, // january
      1, // 1st
      dv.getUint8(o + 24), // hours
      dv.getUint8(o + 25), // minutes
      dv.getUint8(o + 26) // seconds
    ))
    tmp.setUTCDate(dv.getUint16(o + 22, byteorder)) // set month and date
    let starttime = tmp.getTime() + dv.getUint16(o + 28, byteorder) / 10 // add 10e-1 milliseconds
    const net = this.dataViewString(dv, o + 18, 2).trim()
    const sta = this.dataViewString(dv, o + 8, 5).trim()
    const loc = this.dataViewString(dv, o + 13, 2).trim()
    const cha = this.dataViewString(dv, o + 15, 3)
    const srF = dv.getInt16(o + 32, byteorder) // sample rate factor
    const srM = dv.getInt16(o + 34, byteorder) // sample rate multiplier
    const actFlags = dv.getUint8(o + 36) // activity flags
    const tCorr = dv.getInt32(o + 40, byteorder) / 10
    if ((actFlags & 2) === 0) {
      // apply time correction if needed
      starttime += tCorr
    }
    let val = srM < 0 ? srF / srM : srF * srM
    if (srF < 0) {
      val = 1 / val
    }
    return {
      seedId: [net, sta, loc, cha].join('.'),
      starttime,
      npts: dv.getUint16(o + 30, byteorder),
      samplingRate: Math.abs(val),
      dataBegin: dv.getUint16(o + 44, byteorder),
      firstBlockette: dv.getUint16(o + 46, byteorder)
    }
  }

  decodeBlkt1000 (dv: DataView, o: number, byteorder: boolean): Bloquette1000 {
    return {
      nextBloquette: dv.getUint16(o + 2, byteorder),
      encoding: dv.getUint8(o + 4),
      littleEndian: dv.getUint8(o + 5) === 0,
      packetSize: Math.pow(2, dv.getUint8(o + 6))
    }
  }

  decodeINT16 (dv: DataView, h: MSEEDHeaderStrict, index: number) {
    const o = index + h.fsdh.dataBegin
    const data = new Array(h.fsdh.npts)
    for (let i = 0; i < h.fsdh.npts; data[i] = dv.getInt16(o + i * 2, h.blkt1000.littleEndian), i++);
    return data
  }

  decodeINT32 (dv: DataView, h: MSEEDHeaderStrict, index: number) {
    const o = index + h.fsdh.dataBegin
    const data = new Array(h.fsdh.npts)
    for (let i = 0; i < h.fsdh.npts; data[i] = dv.getInt32(o + i * 4, h.blkt1000.littleEndian), i++);
    return data
  }

  decodeIEEE32 (dv: DataView, h: MSEEDHeaderStrict, index: number) {
    const o = index + h.fsdh.dataBegin
    const data = new Array(h.fsdh.npts)
    for (let i = 0; i < h.fsdh.npts; data[i] = dv.getFloat32(o + i * 4, h.blkt1000.littleEndian), i++);
    return data
  }

  decodeIEEE64 (dv: DataView, h: MSEEDHeaderStrict, index: number) {
    const o = index + h.fsdh.dataBegin
    const data = new Array(h.fsdh.npts)
    for (let i = 0; i < h.fsdh.npts; data[i] = dv.getFloat64(o + i * 8, h.blkt1000.littleEndian), i++);
    return data
  }

  decodeSteim (v: number, dv: DataView, h: MSEEDHeaderStrict, index: number) {
    const o = index + h.fsdh.dataBegin
    const nbFrame = (h.blkt1000.packetSize - h.fsdh.dataBegin) / 64
    let fi: number, w0: number, shift: number, fic: number, wi: number, nib: number, dnib: number
    let ric: (null | number) = null
    let dc = 0 // dc for "diff count"
    const d = new Array(h.fsdh.npts)
    const s = new Array(h.fsdh.npts)
    const swapflag = h.blkt1000.littleEndian
    for (let fc = 0; fc < nbFrame; fc++) { // fc for "frame count"
      fi = o + fc * 64 // fi = "frame index" (a frame is 64byte long)
      wi = 4 // wi for "word index"
      shift = 28
      if (fc === 0) { // the 1st frame contains the fic and ric values
        fic = dv.getInt32(fi + wi, swapflag)
        ric = dv.getInt32(fi + wi + 4, swapflag)
        wi = 12
        s[0] = fic
        shift = 24
      }
      w0 = dv.getUint32(fi, swapflag) // w0 (word 0) contains 16 x 2bit nibbles
      while (shift >= 0) {
        nib = w0 >> shift & 3 // the nibble contains a code that indicates the diffs size of its associated word in the frame
        switch (nib) {
          case 0: break // no data
          case 1: for (let i = 0; i < 4; d[dc] = dv.getInt8(fi + wi + i), dc++, i++); break // 4 x 8bit diffs
          case 2:
            if (v === 1) { // STEIM 1
              for (let i = 0; i < 2; d[dc] = dv.getInt16(fi + wi + 2 * i, swapflag), dc++, i++); // 2 x 16bit diffs
            } else if (v === 2) { // STEIM 2
              const wk = dv.getUint32(fi + wi, swapflag)
              dnib = wk >> 30 & 3
              switch (dnib) {
                case 1: d[dc++] = this.signedInt(wk, 30); break // 1 x 30bit diff
                case 2: for (let i = 1; i >= 0; d[dc] = this.signedInt(wk >> 15 * i, 15), dc++, i--); break // 2 x 15bit diffs
                case 3: for (let i = 2; i >= 0; d[dc] = this.signedInt(wk >> 10 * i, 10), dc++, i--); break // 3 x 10bit diffs
              }
            }
            break
          case 3:
            if (v === 1) { // STEIM 1
              d[dc++] = dv.getInt32(fi + wi, swapflag) // 1 x 32bit diff
            } else if (v === 2) { // STEIM 2
              const wk = dv.getUint32(fi + wi, swapflag)
              dnib = wk >> 30 & 3
              switch (dnib) {
                case 0: for (let i = 4; i >= 0; d[dc] = this.signedInt(wk >> 6 * i, 6), dc++, i--); break // 5 x 6bit diffs
                case 1: for (let i = 5; i >= 0; d[dc] = this.signedInt(wk >> 5 * i, 5), dc++, i--); break // 6 x 5bit diffs
                case 2: for (let i = 6; i >= 0; d[dc] = this.signedInt(wk >> 4 * i, 4), dc++, i--); break // 7 x 4bit diffs
              }
            }
            break
        }
        wi += 4
        shift -= 2
      }
    }
    for (let i = 1, l = h.fsdh.npts; i < l; s[i] = s[i - 1] + d[i], i++);
    if (s[s.length - 1] !== ric) {
      console.log(`Decoding error: last sample computed (${s[s.length - 1]}) does not match RIC (${ric}) (packet index: ${index}), ${h.fsdh.seedId}`)
    }
    return s
  }

  _sortTrace () {
    this.traces.sort((a, b) => a.stats.id < b.stats.id ? 1 : a.stats.id > b.stats.id ? -1 : 0)
    return this
  }

  _isYearDayValid (dv: DataView, index: number) {
    const year = dv.getUint16(index + 20)
    const julday = dv.getUint16(index + 22)
    return year >= 1900 && year <= 2100 && julday >= 1 && julday <= 366
  }

  parseMSEED (dv: DataView, updateFunction?: UpdateFunction) {
    let index = 0
    // let packetCount = 0
    let data: number[]
    let trace: (Trace | undefined)
    while (index < dv.byteLength) {
      if (updateFunction !== undefined) {
        updateFunction({ percent: 100 * (index / dv.byteLength) })
      }
      let byteorder: boolean
      const h: (MSEEDHeader | MSEEDHeaderStrict) = {} // object that contains fsdh and all bloquettes
      // decode Fixed Section of Data Header
      if (this._isYearDayValid(dv, index)) {
        byteorder = false // set the byteorder to big endian
      } else {
        byteorder = true // set the byteorder to little endian
      }
      h.fsdh = this.decodeFSDH(dv, index, byteorder)
      // decode bloquette(s)
      let nextBloquette = h.fsdh.firstBlockette
      while (nextBloquette > 0) {
        const blktCode = dv.getUint16(index + nextBloquette, byteorder)
        if (blktCode === 1000) {
          h.blkt1000 = this.decodeBlkt1000(dv, index + nextBloquette, byteorder)
          byteorder = h.blkt1000.littleEndian
          nextBloquette = 0
        } else if (blktCode === 1001) {
          // bloquette 1001 is ignored
          nextBloquette = dv.getUint16(index + nextBloquette + 2, byteorder)
        } else {
          throw new Error(`Unhandled bloquette type ${blktCode} (packet index : ${index})`)
        }
      }
      const hs = <MSEEDHeaderStrict>h
      // decode data
      switch (hs.blkt1000.encoding) {
        case 1: data = this.decodeINT16(dv, hs, index); break
        case 3: data = this.decodeINT32(dv, hs, index); break
        case 4: data = this.decodeIEEE32(dv, hs, index); break
        case 5: data = this.decodeIEEE64(dv, hs, index); break
        case 10: data = this.decodeSteim(1, dv, hs, index); break
        case 11: data = this.decodeSteim(2, dv, hs, index); break
        default: throw new Error(`Unsupported encoding "${this.ENCODING[hs.blkt1000.encoding]}" (packet index: ${index})`)
      }

      if (data.length !== hs.fsdh.npts) {
        console.log(`${data.length} samples retrieved instead of ${hs.fsdh.npts} expected`)
      }
      // retrieve trace if exists
      trace = this.getTrace(hs.fsdh.seedId)
      if (trace) {
        // add data to the existing Trace
        trace._addData(hs.fsdh.starttime, data)
      } else {
        // create a new Trace
        this.traces.push(new Trace({
          id: hs.fsdh.seedId,
          samplingRate: hs.fsdh.samplingRate,
          data: [{ starttime: hs.fsdh.starttime, data }]
        }))
      }
      index += hs.blkt1000.packetSize
      // packetCount++
    }
    this._sortTrace()
    return this
  }
}

export const read = (
  arr: ArrayBuffer,
  finishedCallback: (st: Stream) => void,
  updateCallback: (p: number) => void
) => {
  finishedCallback(new Stream(new DataView(arr)))
}

export const readWithWorker = (
  arr: ArrayBuffer,
  finishedCallback: (st: Stream) => void,
  updateCallback: (p: number) => void
) => {
  const blob = new Blob([workerStr])
  const worker = new Worker(window.URL.createObjectURL(blob))

  worker.onmessage = msg => {
    if (msg.data.status === 'update' && updateCallback != null) {
      updateCallback(msg.data.value)
    } else if (msg.data.status === 'finished') {
      const st = new Stream()
      for (const traceOpt of msg.data.value.traces) {
        st.traces.push(new Trace(traceOpt))
      }
      worker.terminate()
      finishedCallback(st)
    }
  }
  worker.postMessage({ mseed: arr })
}
