import * as text from './text'

const readInventory = (input: string) => {
  return text.parse(input)
}

export default {
  readInventory,
  text
}
