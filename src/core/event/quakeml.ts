import processEvent from './event'
import { ConversionRules, EventParameter } from '../../types'

const CONVERSION_RULES: ConversionRules = {
  nodeList: [
    // keep list for all these nodes :
    '/event_parameters/event',
    '/event_parameters/event/amplitude',
    '/event_parameters/event/station_magnitude',
    '/event_parameters/event/magnitude/station_magnitude_contribution',
    '/event_parameters/event/origin',
    '/event_parameters/event/origin/arrival',
    '/event_parameters/event/magnitude',
    '/event_parameters/event/pick',
    '/event_parameters/event/description',
    '/event_parameters/event/focal_mechanism',
    '/event_parameters/event/focal_mechanism/comment'
  ],
  conversion: {
    // conversion function :
    '/event_parameters/event/origin/latitude/value': parseFloat,
    '/event_parameters/event/origin/latitude/uncertainty': parseFloat,
    '/event_parameters/event/origin/longitude/value': parseFloat,
    '/event_parameters/event/origin/longitude/uncertainty': parseFloat,
    '/event_parameters/event/origin/depth/value': parseFloat,
    '/event_parameters/event/origin/depth/uncertainty': parseFloat,
    '/event_parameters/event/origin/time/uncertainty': parseFloat,
    '/event_parameters/event/origin/quality/standard_error': parseFloat,
    '/event_parameters/event/origin/quality/azimuthal_gap': parseFloat,
    '/event_parameters/event/origin/quality/associated_phase_count': parseInt,
    '/event_parameters/event/origin/quality/associated_station_count': parseInt,
    '/event_parameters/event/origin/quality/used_phase_count': parseInt,
    '/event_parameters/event/origin/quality/used_station_count': parseInt,
    '/event_parameters/event/origin/quality/minimum_distance': parseFloat,
    '/event_parameters/event/origin/quality/maximum_distance': parseFloat,
    '/event_parameters/event/origin/quality/median_distance': parseFloat,
    '/event_parameters/event/origin/arrival/time_residual': parseFloat,
    '/event_parameters/event/origin/arrival/time_weight': parseFloat,
    '/event_parameters/event/origin/arrival/distance': parseFloat,
    '/event_parameters/event/origin/arrival/azimuth': parseFloat,
    '/event_parameters/event/magnitude/mag/value': parseFloat,
    '/event_parameters/event/magnitude/mag/uncertainty': parseFloat,
    '/event_parameters/event/magnitude/stationCount': parseInt,
    '/event_parameters/event/magnitude/station_magnitude_contribution/weight': parseFloat,
    '/event_parameters/event/magnitude/station_magnitude_contribution/residual': parseFloat,
    '/event_parameters/event/amplitude/generic_amplitude': parseFloat,
    '/event_parameters/event/amplitude/snr': parseFloat,
    '/event_parameters/event/amplitude/time_window/begin': parseFloat,
    '/event_parameters/event/amplitude/time_window/end': parseFloat,
    '/event_parameters/event/station_magnitude/mag/value': parseFloat,
    '/event_parameters/event/focal_mechanism/nodal_planes/nodal_plane1/strike/value': parseFloat,
    '/event_parameters/event/focal_mechanism/nodal_planes/nodal_plane1/dip/value': parseFloat,
    '/event_parameters/event/focal_mechanism/nodal_planes/nodal_plane1/rake/value': parseFloat,
    '/event_parameters/event/focal_mechanism/nodal_planes/nodal_plane2/strike/value': parseFloat,
    '/event_parameters/event/focal_mechanism/nodal_planes/nodal_plane2/dip/value': parseFloat,
    '/event_parameters/event/focal_mechanism/nodal_planes/nodal_plane2/rake/value': parseFloat
  }
}

const RESOURCE_ID_KEYS = [
  '/event_parameters/event/public_id',
  '/event_parameters/event/preferred_origin_id',
  '/event_parameters/event/preferred_magnitude_id',
  '/event_parameters/event/preferred_focal_mechanism_id',
  '/event_parameters/event/origin/public_id',
  '/event_parameters/event/origin/earth_model_id',
  '/event_parameters/event/origin/method_id',
  '/event_parameters/event/origin/arrival/pick_id',
  '/event_parameters/event/magnitude/public_id',
  '/event_parameters/event/magnitude/method_id',
  '/event_parameters/event/magnitude/origin_id',
  '/event_parameters/event/magnitude/station_magnitude_contribution/station_magnitude_id',
  '/event_parameters/event/pick/public_id',
  '/event_parameters/event/station_magnitude/origin_id',
  '/event_parameters/event/station_magnitude/public_id',
  '/event_parameters/event/station_magnitude/amplitude_id',
  '/event_parameters/event/amplitude/public_id',
  '/event_parameters/event/amplitude/pick_id',
  '/event_parameters/event/focal_mechanism/public_id',
  '/event_parameters/event/focal_mechanism/triggering_origin_id'
]

const toSnakeCase = (x: string) => {
  return x.replace(/([A-Z]+)/g, '_$1').toLowerCase()
}

export const removeResourcePrefix = (id: string) => {
  if (id.indexOf('smi:org.gfz-potsdam.de/geofon/') === 0) {
    return id.replace('smi:org.gfz-potsdam.de/geofon/', '')
  } else if (id.indexOf('smi:') === 0 || id.indexOf('quakeml:') === 0) {
    return id.split('/').slice(2).join('/')
  }
  console.warn(`Failed to remove prefix of resource ID: ${id}`)
  return id
}

const xmlNodeToJson = (x: Element, path: string, rules: ConversionRules) => {
  path = `${path}/${toSnakeCase(x.tagName)}`
  const obj: Record<string, any> = {}
  for (const a of x.attributes) {
    const key = toSnakeCase(a.name)
    const currentPath = `${path}/${key}`
    let conv = rules.conversion[currentPath]
    if (RESOURCE_ID_KEYS.indexOf(currentPath) >= 0) {
      conv = removeResourcePrefix
    }
    obj[key] = conv ? conv(a.value) : a.value
  }
  if (x.children.length === 0) {
    // console.log(path);
    let conv = rules.conversion[path]
    if (RESOURCE_ID_KEYS.indexOf(path) >= 0) {
      conv = removeResourcePrefix
    }
    // console.log(path, conv);
    const value = conv && x.textContent != null ? conv(x.textContent) : x.textContent
    return Object.keys(obj).length > 0 ? Object.assign(obj, { value }) : value
  } else {
    for (const c of x.children) {
      const key = toSnakeCase(c.tagName)
      const currentPath = `${path}/${key}`
      const value = xmlNodeToJson(c, path, rules)
      if (rules.nodeList.indexOf(currentPath) >= 0) { // it's a list
        if (obj[key] === undefined) {
          obj[key] = []
        }
        obj[key].push(value)
      } else {
        obj[key] = value
      }
    }
  }
  return obj
}

export const parse = (qml: XMLDocument) => {
  const events = xmlNodeToJson(
    qml.getElementsByTagName('eventParameters')[0],
    '',
    CONVERSION_RULES
  ).event
  return events != null ? events.map((e: EventParameter) => processEvent(e)) : []
}
