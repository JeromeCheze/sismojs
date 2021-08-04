import { Inventory } from '../../types'

const NETWORK = 0
const STATION = 1
const LOCATION = 2
const CHANNEL = 3
const LATITUDE = 4
const LONGITUDE = 5
const ALTITUDE = 6
const DEPTH = 7
const AZIMUTH = 8
const DIP = 9
const SCALE = 11
const UNITS = 13
const SAMPLE_RATE = 14
const STARTTIME = 15
const ENDTIME = 16

export const parse = (text: string) => {
  const result: Inventory = {}
  const spInv = text.split(/[\r\n]+/g)
  for (const l of spInv) {
    if (l !== '' && l[0] !== '#') {
      const spLine = l.split('|')
      const [net, sta, loc, cha] = [spLine[NETWORK], spLine[STATION], spLine[LOCATION], spLine[CHANNEL]]
      if (result[net] === undefined) {
        result[net] = {}
      }
      if (result[net][sta] === undefined) {
        result[net][sta] = {
          lat: parseFloat(spLine[LATITUDE]),
          lon: parseFloat(spLine[LONGITUDE]),
          alt: parseFloat(spLine[ALTITUDE]),
          location: {}
        }
      }
      if (result[net][sta].location[loc] === undefined) {
        result[net][sta].location[loc] = {}
      }
      if (result[net][sta].location[loc][cha] === undefined) {
        result[net][sta].location[loc][cha] = []
      }
      result[net][sta].location[loc][cha].push({
        azimuth: parseFloat(spLine[AZIMUTH]),
        dip: parseFloat(spLine[DIP]),
        scale: parseFloat(spLine[SCALE]),
        depth: parseFloat(spLine[DEPTH]),
        starttime: new Date(Date.parse(spLine[STARTTIME])),
        endtime: spLine[ENDTIME] === '' ? new Date() : new Date(Date.parse(spLine[ENDTIME])),
        sample_rate: parseFloat(spLine[SAMPLE_RATE]),
        units: spLine[UNITS]
      })
    }
  }
  return result
}
