import type { Inventory } from '../../types'

const COLS = {
  network: ['network', 'description', 'starttime', 'endtime', 'totalStations'],
  station: ['network', 'station', 'latitude', 'longitude', 'elevation', 'siteName', 'starttime', 'endtime'],
  channel: ['network', 'station', 'location', 'channel', 'latitude', 'longitude', 'elevation', 'depth', 'azimuth', 'dip', 'sensorDescription', 'scale', 'scaleFrequency', 'scaleUnits', 'sampleRate', 'starttime', 'endtime']
}

function toDict(cols: string[], values: any[]): Record<string, any> {
  const result: Record<string, any> = {}
  for (let i = 0; i < cols.length; i++) {
    result[cols[i]] = values[i]
  }
  return result
}

export const parse = (text: string) => {
  const result: Inventory = {}
  const spInv = text.split(/[\r\n]+/g)
  for (const l of spInv) {
    if (l !== '' && l[0] !== '#') {
      const spLine = l.split('|')
      const level = spLine.length === COLS.network.length
        ? 'network'
        : spLine.length === COLS.station.length
          ? 'station'
          : spLine.length === COLS.channel.length
            ? 'channel'
            : null
      if (level == null) {
        throw new Error(`Failed to parse line: ${l}`)
      }
      const o = toDict(COLS[level], spLine)
      if (result[o.network] === undefined) {
        result[o.network] = {}
      }
      if (o.station != null) {
        if (result[o.network][o.station] === undefined) {
          result[o.network][o.station] = {
            lat: parseFloat(o.latitude),
            lon: parseFloat(o.longitude),
            alt: parseFloat(o.elevation),
            location: {}
          }
        }
        if (o.location != null) {
          const loc = o.location === '--' ? '' : o.location
          if (result[o.network][o.station].location[loc] === undefined) {
            result[o.network][o.station].location[loc] = {}
          }
          if (result[o.network][o.station].location[loc][o.channel] === undefined) {
            result[o.network][o.station].location[loc][o.channel] = []
          }
          result[o.network][o.station].location[loc][o.channel].push({
            azimuth: parseFloat(o.azimuth),
            dip: parseFloat(o.dip),
            scale: parseFloat(o.scale),
            depth: parseFloat(o.depth),
            starttime: new Date(Date.parse(o.starttime)),
            endtime: o.endtime === '' ? new Date() : new Date(Date.parse(o.endtime)),
            sample_rate: parseFloat(o.sampleRate),
            units: o.units
          })
        }
      }
    }
  }
  return result
}
