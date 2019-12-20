import * as quakeml from './quakeml.js'
import * as text from './text.js'

const readEvents = input => {
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
