export default `class Trace {
  constructor ({ id, samplingRate, data, stats, timeseries }) {
    // This define a time tolerance (as a period ratio) for continuous traces
    let TOLERANCE = 0.005
    this.timeseries = timeseries != null ? timeseries : []
    if (stats != null) {
      this.stats = stats
    } else {
      let [network, station, location, channel] = id.split('.')
      this.stats = {
        id,
        network,
        station,
        location,
        channel,
        samplingRate,
        delta: 1.0 / samplingRate,
        npts: 0,
        starttime: null,
        endtime: null
      }
    }
    this.__tolerance = 1e3 * TOLERANCE / this.stats.samplingRate
    if (data) {
      for (let currData of data) {
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
        let d = new Date()
        d.setTime(this.timeseries[i - 1].endtime)
        console.log(\`\${this.stats.id} : Warning: found gap of \${gapLength} seconds (\${nbSamples}) | gap begin at \${d.toISOString()}\`)
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

  _addData (starttime, data) {
    const endtime = starttime + (data.length / this.stats.samplingRate) * 1e3
    if (this.timeseries.length === 0) {
      this.timeseries.push({ starttime, endtime, data })
      this.stats.starttime = starttime
      this.stats.endtime = endtime
      return this._updateStats()
    }
    // try to merge data to an existing timeseries
    for (let timeserie of this.timeseries) {
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
    for (let [i, timeserie] of this.timeseries.entries()) {
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
    let allData = []
    let nbSamples = 0
    for (let timeserie of this.timeseries) {
      allData = allData.concat(timeserie.data)
      nbSamples += timeserie.data.length
    }
    return Math.floor(allData.reduce((x, y) => x + y) / nbSamples)
  }
}

class Stream {
  constructor (dv, updateFunction) {
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

  signedInt (value, size) {
    const mask = Math.pow(2, size) - 1
    value &= mask
    return value >> (size - 1) ? -1 * (~value & mask) - 1 : value
  }

  dataViewString (dv, offset, len) {
    let result = new Array(len)
    for (let i = 0; i < len; i++) {
      result[i] = String.fromCharCode(dv.getUint8(offset + i))
    }
    return result.join('')
  }

  getTrace (id) {
    for (let trace of this.traces) {
      if (trace.stats.id === id) {
        return trace
      }
    }
  }

  decodeFSDH (dv, o, byteorder) {
    let tmp = new Date()
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
    let net = this.dataViewString(dv, o + 18, 2).trim()
    let sta = this.dataViewString(dv, o + 8, 5).trim()
    let loc = this.dataViewString(dv, o + 13, 2).trim()
    let cha = this.dataViewString(dv, o + 15, 3)
    let srF = dv.getInt16(o + 32, byteorder) // sample rate factor
    let srM = dv.getInt16(o + 34, byteorder) // sample rate multiplier
    let actFlags = dv.getUint8(o + 36) // activity flags
    let tCorr = dv.getInt32(o + 40, byteorder) / 10
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
      starttime: starttime,
      npts: dv.getUint16(o + 30, byteorder),
      samplingRate: Math.abs(val),
      dataBegin: dv.getUint16(o + 44, byteorder),
      firstBlockette: dv.getUint16(o + 46, byteorder)
    }
  }

  decodeBlkt1000 (dv, o, byteorder) {
    return {
      nextBloquette: dv.getUint16(o + 2, byteorder),
      encoding: dv.getUint8(o + 4),
      littleEndian: dv.getUint8(o + 5) === 0,
      packetSize: Math.pow(2, dv.getUint8(o + 6))
    }
  }

  decodeINT16 (dv, h, index) {
    let o = index + h.fsdh.dataBegin
    let data = new Array(h.fsdh.npts)
    for (let i = 0; i < h.fsdh.npts; data[i] = dv.getInt16(o + i * 2, h.blkt1000.littleEndian), i++);
    return data
  }

  decodeINT32 (dv, h, index) {
    let o = index + h.fsdh.dataBegin
    let data = new Array(h.fsdh.npts)
    for (let i = 0; i < h.fsdh.npts; data[i] = dv.getInt32(o + i * 4, h.blkt1000.littleEndian), i++);
    return data
  }

  decodeIEEE32 (dv, h, index) {
    let o = index + h.fsdh.dataBegin
    let data = new Array(h.fsdh.npts)
    for (let i = 0; i < h.fsdh.npts; data[i] = dv.getFloat32(o + i * 4, h.blkt1000.littleEndian), i++);
    return data
  }

  decodeIEEE64 (dv, h, index) {
    let o = index + h.fsdh.dataBegin
    let data = new Array(h.fsdh.npts)
    for (let i = 0; i < h.fsdh.npts; data[i] = dv.getFloat64(o + i * 8, h.blkt1000.littleEndian), i++);
    return data
  }

  decodeSteim (v, dv, h, index) {
    let o = index + h.fsdh.dataBegin
    let nbFrame = (h.blkt1000.packetSize - h.fsdh.dataBegin) / 64
    let fi, w0, shift, fic, ric, wi, nib, dnib
    let dc = 0 // dc for "diff count"
    let d = new Array(h.fsdh.npts)
    let s = new Array(h.fsdh.npts)
    let swapflag = h.blkt1000.littleEndian
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
              let wk = dv.getUint32(fi + wi, swapflag)
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
              let wk = dv.getUint32(fi + wi, swapflag)
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
      console.log(\`Decoding error: last sample computed (\${s[s.length - 1]}) does not match RIC (\${ric}) (packet index: \${index}), \${h.fsdh.seedId}\`)
    }
    return s
  }

  _sortTrace () {
    this.traces.sort((a, b) => a.stats.id < b.stats.id ? 1 : a.stats.id > b.stats.id ? -1 : 0)
    return this
  }

  _isYearDayValid (dv, index) {
    let year = dv.getUint16(index + 20)
    let julday = dv.getUint16(index + 22)
    return year >= 1900 && year <= 2100 && julday >= 1 && julday <= 366
  }

  parseMSEED (dv, updateFunction) {
    let index = 0
    // let packetCount = 0
    let data
    let trace
    while (index < dv.byteLength) {
      if (updateFunction !== undefined) {
        updateFunction({ percent: 100 * (index / dv.byteLength) })
      }
      let byteorder
      let h = {} // object that contains fsdh and all bloquettes
      // decode Fixed Section of Data Header
      if (this._isYearDayValid(dv, index)) {
        byteorder = false // set the byteorder to big endian
      } else {
        byteorder = true // set the byteorder to little endian
      }
      h.fsdh = this.decodeFSDH(dv, index, byteorder)
      // decode bloquette(s)
      let nextBloquette = h.fsdh.firstBlockette
      let skip = false
      while (nextBloquette > 0) {
        let blktCode = dv.getUint16(index + nextBloquette, byteorder)
        if (blktCode === 1000) {
          h.blkt1000 = this.decodeBlkt1000(dv, index + nextBloquette, byteorder)
          byteorder = h.blkt1000.littleEndian
          // nextBloquette = 0
          nextBloquette = dv.getUint16(index + nextBloquette + 2, byteorder)
        } else if (blktCode === 1001) {
          // bloquette 1001 is ignored
          nextBloquette = dv.getUint16(index + nextBloquette + 2, byteorder)
        } else if (blktCode === 100) {
         // bloquette 100 is ignored
          let samplingRate = dv.getFloat32(index + nextBloquette + 4, byteorder)
          nextBloquette = dv.getUint16(index + nextBloquette + 2, byteorder)
          if (100 * Math.abs(samplingRate - h.fsdh.samplingRate) / h.fsdh.samplingRate > 0.01) {
            console.warn(\`\${h.fsdh.seedId}: Blockette 100: discard data, actual sampling rate (\${samplingRate}) is too different from the one in the header (\${h.fsdh.samplingRate})\`)
            skip = true
          }
          console.warn(\`\${h.fsdh.seedId}: Blockette 100 ignored, using sampling rate \${h.fsdh.samplingRate} instead of \${samplingRate}\`)
        } else {
          throw new Error(\`\${h.fsdh.seedId}: Unhandled bloquette type \${blktCode} (packet index : \${index})\`)
        }
      }
      if (skip) {
        index += h.blkt1000.packetSize
        continue
      }
      // decode data
      switch (h.blkt1000.encoding) {
        case 1: data = this.decodeINT16(dv, h, index); break
        case 3: data = this.decodeINT32(dv, h, index); break
        case 4: data = this.decodeIEEE32(dv, h, index); break
        case 5: data = this.decodeIEEE64(dv, h, index); break
        case 10: data = this.decodeSteim(1, dv, h, index); break
        case 11: data = this.decodeSteim(2, dv, h, index); break
        default: throw new Error(\`Unsupported encoding "\${this.ENCODING[h.blkt1000.encoding]}" (packet index: \${index})\`)
      }

      if (data.length !== h.fsdh.npts) {
        console.log(\`\${data.length} samples retrieved instead of \${h.fsdh.npts} expected\`)
      }
      // retrieve trace if exists
      trace = this.getTrace(h.fsdh.seedId)
      if (trace) {
        // add data to the existing Trace
        trace._addData(h.fsdh.starttime, data)
      } else {
        // create a new Trace
        this.traces.push(new Trace({
          id: h.fsdh.seedId,
          samplingRate: h.fsdh.samplingRate,
          data: [{ starttime: h.fsdh.starttime, data }]
        }))
      }
      index += h.blkt1000.packetSize
      // packetCount++
    }
    this._sortTrace()
    return this
  }
}

let lastMessage = null
const updateFunction = (data) => {
  let now = new Date().getTime()
  if (lastMessage == null) {
    lastMessage = now
  }
  if ((now - lastMessage) > 100) {
    lastMessage = now
    this.postMessage({ status: 'update', value: data.percent })
  }
}

this.onmessage = (msg) => {
  let result = { traces: [] }
  let st = new Stream(new DataView(msg.data.mseed), updateFunction)
  for (let tr of st.traces) {
    result.traces.push({ stats: tr.stats, timeseries: tr.timeseries })
  }
  postMessage({ status: 'finished', value: result })
  close()
}`
