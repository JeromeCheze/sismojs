import event from './event/index.js'
import station from './station/index.js'
import * as waveform from './waveform/index.js'

export default {
  read: waveform.read,
  readEvents: event.readEvents,
  readInventory: station.readInventory,
  Trace: waveform.Trace,
  Stream: waveform.Stream,
  waveform,
  event,
  station
}
