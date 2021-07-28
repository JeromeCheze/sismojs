import { Event } from '../../types'
import * as quakeml from './quakeml'
import * as text from './text'

const readEvents = (input: string | XMLDocument): Event[] => {
  if (typeof input === 'string') {
    return text.parse(input)
  } else {
    return quakeml.parse(input)
  }
}

export default {
  readEvents,
  quakeml,
  text
}
