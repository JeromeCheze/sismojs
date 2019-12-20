export const parse = (text) => {
  let cols = [
    'network', 'station', 'location', 'channel',
    'lat', 'lon', 'alt', 'depth',
    'azimuth', 'dip', '_', 'scale', '_', 'units',
    'sample_rate', 'starttime', 'endtime'
  ]
  let result = {}
  let sp_inv = text.split(/[\r\n]+/g)
  for (let l of sp_inv) {
    if (l != '' && l[0] != '#') {
      let c = dict(cols, l.split('|'))
      if (result[c.network] == null) {
        result[c.network] = {}
      }
      if (result[c.network][c.station] == null) {
        result[c.network][c.station] = {
          lat: parseFloat(c.lat),
          lon: parseFloat(c.lon),
          alt: parseFloat(c.alt),
          location: {}
        }
      }
      if (result[c.network][c.station].location[c.location] == null) {
        result[c.network][c.station].location[c.location] = {}
      }
      if (result[c.network][c.station].location[c.location][c.channel] == null) {
        result[c.network][c.station].location[c.location][c.channel] = []
      }
      result[c.network][c.station].location[c.location][c.channel].push({
        azimuth: parseFloat(c.azimuth),
        dip: parseFloat(c.dip),
        scale: parseFloat(c.scale),
        depth: parseFloat(c.depth),
        starttime: new Date(Date.parse(c.starttime)),
        endtime: c.endtime == '' ? new Date() : new Date(Date.parse(c.endtime)),
        sample_rate: parseFloat(c.sample_rate),
        units: c.units
      })
    }
  }
  return result
}
