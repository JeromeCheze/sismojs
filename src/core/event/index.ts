import type { EventParameter } from '../../types'
import * as quakeml from './quakeml'
import * as text from './text'
import { processEvent } from './event'

const readEvents = (input: string | XMLDocument): EventParameter[] => {
  if (typeof input === 'string') {
    return text.parse(input)
  } else {
    return quakeml.parse(input)
  }
}

export default {
  processEvent,
  readEvents,
  quakeml,
  text
}
