import core from './core/index.js'
import * as fdsn from './fdsn/index.js'

export default {
  read: core.read,
  readEvents: core.readEvents,
  readInventory: core.readInventory,
  core,
  fdsn
}
