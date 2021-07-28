import core from './core'
import * as fdsn from './fdsn'

export default {
  read: core.read,
  readEvents: core.readEvents,
  readInventory: core.readInventory,
  core,
  fdsn
}
