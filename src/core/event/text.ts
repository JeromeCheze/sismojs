import processEvents from './event'
import { EventParameter } from '../../types'

const EVENT_ID = 0
const TIME = 1
const LATITUDE = 2
const LONGITUDE = 3
const DEPTH = 4
const AUTHOR = 5
// const CATALOG = 6
// const CONSTRIBUTOR = 7
// const CONSTRIBUTOR_ID = 8
const MAG_TYPE = 9
const MAGNITUDE = 10
const MAG_AUTHOR = 11
const EVENT_LOCATION_NAME = 12
const EVENT_TYPE = 13

export const parse = (text: string): EventParameter[] => {
  const lines = text.split('\n')
  const events: EventParameter[] = []
  for (const line of lines.slice(1)) {
    if (line === '') {
      continue
    }
    const splited = line.split('|')
    const event: EventParameter = {
      origin: [{
        public_id: 'origin-0',
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
          value: parseFloat(splited[DEPTH])
        },
        region: splited[EVENT_LOCATION_NAME],
        creation_info: {
          author: splited[AUTHOR]
        }
      }],
      magnitude: [{
        public_id: 'magnitude-0',
        mag: {
          value: parseFloat(splited[MAGNITUDE])
        },
        type: splited[MAG_TYPE],
        creation_info: {
          author: splited[MAG_AUTHOR]
        }
      }],
      type: splited[EVENT_TYPE],
      public_id: splited[EVENT_ID],
      preferred_origin_id: 'origin-0',
      preferred_magnitude_id: 'magnitude-0'
    }
    events.push(event)
  }
  return events.map(e => processEvents(e))
}
