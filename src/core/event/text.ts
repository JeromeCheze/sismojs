import { processEvent } from './event'
// import type { EventParameter } from '../../types'
import { QEvent, type QEventDescription } from './types'

const EVENT_ID = 0
const TIME = 1
const LATITUDE = 2
const LONGITUDE = 3
const DEPTH = 4
const AUTHOR = 5
// const CATALOG = 6
const CONSTRIBUTOR = 7
// const CONSTRIBUTOR_ID = 8
const MAG_TYPE = 9
const MAGNITUDE = 10
const MAG_AUTHOR = 11
const EVENT_LOCATION_NAME = 12
const EVENT_TYPE = 13

export const parse = (text: string): QEvent[] => {
  const lines = text.split('\n')
  const events: QEventDescription[] = []
  for (const line of lines.slice(1)) {
    if (line === '') {
      continue
    }
    const splited = line.split('|')
    const event: QEventDescription = {
      origin: [{
        '@publicID': 'origin-0',
        time: {
          value: `${splited[TIME]}Z`
        },
        latitude: {
          value: parseFloat(splited[LATITUDE])
        },
        longitude: {
          value: parseFloat(splited[LONGITUDE])
        },
        depth: {
          value: parseFloat(splited[DEPTH]) * 1e3
        },
        region: splited[EVENT_LOCATION_NAME],
        creationInfo: {
          author: splited[AUTHOR],
          agencyID: splited[CONSTRIBUTOR]
        },
        arrival: []
      }],
      magnitude: [{
        '@publicID': 'magnitude-0',
        originID: 'origin-0',
        mag: {
          value: parseFloat(splited[MAGNITUDE])
        },
        type: splited[MAG_TYPE],
        creationInfo: {
          author: splited[MAG_AUTHOR],
          agencyID: splited[CONSTRIBUTOR]
        }
      }],
      type: splited[EVENT_TYPE],
      '@publicID': splited[EVENT_ID],
      preferredOriginID: 'origin-0',
      preferredMagnitudeID: 'magnitude-0',
      stationMagnitude: [],
      focalMechanism: [],
      amplitude: [],
      pick: []
    }
    events.push(event)
  }
  return events.map(e => new QEvent(e))
}
