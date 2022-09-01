import core from './core'
import * as fdsn from './fdsn'
import * as utils from './utils'

export default {
  read: core.read,
  readEvents: core.readEvents,
  readInventory: core.readInventory,
  core,
  fdsn,
  utils
}
