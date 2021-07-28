import { WaveformId, Event } from '../../types'

const toSeedId = (wfid: WaveformId): string => {
  if (wfid.value) {
    delete wfid.value
  }
  let loc = wfid.location_code == null ? '' : wfid.location_code
  return [wfid.network_code, wfid.station_code, loc, wfid.channel_code].join('.')
}

export default function processEvents (e: Event): Event {
  // e._id = e.public_id.split('/').slice(-1)[0]
  for (let o of e.origin) {
    o.time._value = new Date(Date.parse(o.time.value))
    o.time._pretty = o.time._value.toISOString().replace('T', ' ').substr(0, 19)
    if (o.creation_info.creation_time) {
      o.creation_info._creation_time = new Date(Date.parse(o.creation_info.creation_time))
      o.creation_info._pretty_creation_time = o.creation_info._creation_time.toISOString().replace('T', ' ').substr(0, 19)
    }
    let [lat, lon] = [o.latitude.value, o.longitude.value]
    o.latitude._pretty = lat > 0 ? `${lat.toFixed(2)}° N` : `${(-1 * lat).toFixed(2)}° S`
    o.latitude._pretty_uncertainty = o.latitude.uncertainty != null ? `+/- ${(o.latitude.uncertainty).toFixed(1)} km` : ''
    o.longitude._pretty = lon > 0 ? `${lon.toFixed(2)}° E` : `${(-1 * lon).toFixed(2)}° W`
    o.longitude._pretty_uncertainty = o.longitude.uncertainty != null ? `+/- ${(o.longitude.uncertainty).toFixed(1)} km` : ''
    o.depth._pretty = `${(o.depth.value / 1000).toFixed(0)} km`
    o.depth._pretty_uncertainty = o.depth.uncertainty != null ? `+/- ${(o.depth.uncertainty / 1000).toFixed(1)} km` : '(fixed)'
  }
  if (e.amplitude != null && e.station_magnitude != null) {
    for (let a of e.amplitude) {
      a._seedid = toSeedId(a.waveform_id)
    }
    for (let sm of e.station_magnitude) {
      sm._amplitude = e.amplitude.find(x => x.public_id === sm.amplitude_id)
      sm.mag._pretty = sm.mag.value.toFixed(2)
      sm._seedid = toSeedId(sm.waveform_id)
    }
  }
  if (e.magnitude != null) {
    for (let m of e.magnitude) {
      m.mag._pretty = m.mag.value.toFixed(2)
      if (m.creation_info.creation_time) {
        m.creation_info._creation_time = new Date(Date.parse(m.creation_info.creation_time))
        m.creation_info._pretty_creation_time = m.creation_info._creation_time.toISOString().replace('T', ' ').substr(0, 19)
      }
      if (e.station_magnitude != null && m.station_magnitude_contribution != null) {
        for (let smc of m.station_magnitude_contribution) {
          smc._station_magnitude = e.station_magnitude.find(x => x.public_id === smc.station_magnitude_id)
          if (smc.residual == null) {
            smc.residual = smc._station_magnitude.mag.value - m.mag.value
          }
          smc._pretty_residual = smc.residual != null ? smc.residual.toFixed(2) : '-'
          smc._pretty_weight = smc.weight != null ? smc.weight.toFixed(2) : '-'
        }
      }
    }
  } else {
    e.magnitude = []
  }
  e._po = e.preferred_origin_id ? e.origin.find(x => x.public_id === e.preferred_origin_id) : e.origin[0]
  if (e._po.region) {
    e._region = e._po.region
  } else if (e.description) {
    e._region = e.description[0].text
  } else {
    e._region = ''
  }
  e._region = e._region.toUpperCase()
  if (e.preferred_magnitude_id) {
    e._pm = e.magnitude.find(x => x.public_id === e.preferred_magnitude_id)
  } else {
    e.preferred_magnitude_id = null
  }
  if (e.pick != null && e._po.arrival != null) {
    let pickMap = {}
    for (let p of e.pick) {
      p.time._value = new Date(Date.parse(p.time.value))
      // p._id = p.public_id.split('/').slice(-1)[0]
      let wfid = p.waveform_id
      p._seedid = toSeedId(wfid)
      p._fdsnid = p._seedid.replace('..', '.--.')
      // pickMap[p._id] = p
      pickMap[p.public_id] = p
    }
    for (let o of e.origin) {
      let arrivalToIgnore = []
      for (let a of o.arrival) {
        if (a.public_id) {
          delete a.public_id
        }
        // a._pick_id = a.pick_id.split('/').slice(-1)[0]
        // a._pick = pickMap[a._pick_id]
        a.time_weight = a.time_weight == null ? 0 : a.time_weight
        a._pick = pickMap[a.pick_id]
        if (a._pick == null) {
          arrivalToIgnore.push(a)
          console.warn(`Can't find the pick ${a.pick_id} referenced by an arrival, ignoring arrival.`)
          continue
        }
        a._traveltime = new Date(a._pick.time._value.getTime() - o.time._value.getTime())
      }
      for (let a of arrivalToIgnore) {
        o.arrival.splice(o.arrival.indexOf(a), 1)
      }
    }
  }
  return e
}
