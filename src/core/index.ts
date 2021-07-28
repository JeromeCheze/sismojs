import event from './event'
import station from './station'
import * as waveform from './waveform'

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
