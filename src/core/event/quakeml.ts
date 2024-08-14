import type { ConversionRules } from '../../types'
import { QEvent, type QEventDescription } from './types'

const CONVERSION_RULES: ConversionRules = {
  nodeList: [
    // keep list for all these nodes :
    'eventParameters.event',
    'eventParameters.event.amplitude',
    'eventParameters.event.stationMagnitude',
    'eventParameters.event.magnitude.stationMagnitudeContribution',
    'eventParameters.event.origin',
    'eventParameters.event.origin.arrival',
    'eventParameters.event.magnitude',
    'eventParameters.event.pick',
    'eventParameters.event.description',
    'eventParameters.event.focalMechanism',
    'eventParameters.event.focalMechanism.comment'
  ],
  conversion: {
    // conversion function :
    'eventParameters.event.origin.latitude.value': parseFloat,
    'eventParameters.event.origin.latitude.uncertainty': parseFloat,
    'eventParameters.event.origin.longitude.value': parseFloat,
    'eventParameters.event.origin.longitude.uncertainty': parseFloat,
    'eventParameters.event.origin.depth.value': parseFloat,
    'eventParameters.event.origin.depth.uncertainty': parseFloat,
    'eventParameters.event.origin.time.uncertainty': parseFloat,
    'eventParameters.event.origin.quality.standardError': parseFloat,
    'eventParameters.event.origin.quality.azimuthalGap': parseFloat,
    'eventParameters.event.origin.quality.associatedPhaseCount': parseInt,
    'eventParameters.event.origin.quality.associatedStationCount': parseInt,
    'eventParameters.event.origin.quality.usedPhaseCount': parseInt,
    'eventParameters.event.origin.quality.usedStationCount': parseInt,
    'eventParameters.event.origin.quality.minimumDistance': parseFloat,
    'eventParameters.event.origin.quality.maximumDistance': parseFloat,
    'eventParameters.event.origin.quality.medianDistance': parseFloat,
    'eventParameters.event.origin.arrival.timeResidual': parseFloat,
    'eventParameters.event.origin.arrival.timeWeight': parseFloat,
    'eventParameters.event.origin.arrival.distance': parseFloat,
    'eventParameters.event.origin.arrival.azimuth': parseFloat,
    'eventParameters.event.magnitude.mag.value': parseFloat,
    'eventParameters.event.magnitude.mag.uncertainty': parseFloat,
    'eventParameters.event.magnitude.stationCount': parseInt,
    'eventParameters.event.magnitude.stationMagnitudeContribution.weight': parseFloat,
    'eventParameters.event.magnitude.stationMagnitudeContribution.residual': parseFloat,
    'eventParameters.event.amplitude.genericAmplitude': parseFloat,
    'eventParameters.event.amplitude.snr': parseFloat,
    'eventParameters.event.amplitude.timeWindow.begin': parseFloat,
    'eventParameters.event.amplitude.timeWindow.end': parseFloat,
    'eventParameters.event.stationMagnitude.mag.value': parseFloat,
    'eventParameters.event.pick.time.uncertainty': parseFloat,
    'eventParameters.event.focalMechanism.nodalPlanes.nodalPlane1.strike.value': parseFloat,
    'eventParameters.event.focalMechanism.nodalPlanes.nodalPlane1.dip.value': parseFloat,
    'eventParameters.event.focalMechanism.nodalPlanes.nodalPlane1.rake.value': parseFloat,
    'eventParameters.event.focalMechanism.nodalPlanes.nodalPlane2.strike.value': parseFloat,
    'eventParameters.event.focalMechanism.nodalPlanes.nodalPlane2.dip.value': parseFloat,
    'eventParameters.event.focalMechanism.nodalPlanes.nodalPlane2.rake.value': parseFloat
  }
}

const RESOURCE_ID_KEYS = [
  'eventParameters.event.@publicID',
  'eventParameters.event.preferredOriginID',
  'eventParameters.event.preferredMagnitudeID',
  'eventParameters.event.preferredFocalMechanismID',
  'eventParameters.event.origin.@publicID',
  'eventParameters.event.origin.earthModelID',
  'eventParameters.event.origin.methodID',
  'eventParameters.event.origin.arrival.@publicID',
  'eventParameters.event.origin.arrival.pickID',
  'eventParameters.event.magnitude.@publicID',
  'eventParameters.event.magnitude.methodID',
  'eventParameters.event.magnitude.originID',
  'eventParameters.event.magnitude.stationMagnitudeContribution.stationMagnitudeID',
  'eventParameters.event.pick.@publicID',
  'eventParameters.event.pick.methodID',
  'eventParameters.event.pick.filterID',
  'eventParameters.event.stationMagnitude.originID',
  'eventParameters.event.stationMagnitude.@publicID',
  'eventParameters.event.stationMagnitude.amplitudeID',
  'eventParameters.event.amplitude.@publicID',
  'eventParameters.event.amplitude.filterID',
  'eventParameters.event.amplitude.methodID',
  'eventParameters.event.amplitude.pickID',
  'eventParameters.event.focalMechanism.@publicID',
  'eventParameters.event.focalMechanism.triggeringOriginID'
]

// const toSnakeCase = (x: string) => {
//   return x.replace(/([A-Z]+)/g, '_$1').toLowerCase()
// }

export const removeResourcePrefix = (id: string) => {
  if (id.indexOf('smi:org.gfz-potsdam.de/geofon/') === 0) {
    return id.replace('smi:org.gfz-potsdam.de/geofon/', '')
  } else if (id.indexOf('smi:') === 0 || id.indexOf('quakeml:') === 0) {
    const sp = id.split('/')
    const result = sp.length > 2 ? sp.slice(2).join('/') : sp.slice(-1)[0]
    if (result !== '') {
      return result
    }
  }
  console.warn(`Failed to remove prefix of resource ID: ${id}`)
  return id
}

const xmlNodeToJson = (x: Element, path: string, rules: ConversionRules) => {
  // path = `${path}/${toSnakeCase(x.tagName)}`
  const obj: Record<string, any> = {}
  if (x.hasAttributes()) {
    for (let i = 0; i < x.attributes.length; i++) {
      const key = `@${x.attributes[i].name}`
      const currentPath = `${path}.${key}`
      let conv = rules.conversion[currentPath]
      if (RESOURCE_ID_KEYS.indexOf(currentPath) >= 0) {
        conv = removeResourcePrefix
      }
      obj[key] = conv ? conv(x.attributes[i].value) : x.attributes[i].value
    }
  }
  if (x.children.length === 0) {
    // console.log(path);
    let conv = rules.conversion[path]
    if (RESOURCE_ID_KEYS.indexOf(path) >= 0) {
      conv = removeResourcePrefix
    }
    // console.log(path, conv);
    const value = conv && x.textContent != null ? conv(x.textContent) : x.textContent
    return Object.keys(obj).length > 0
      ? value.length > 0
        ? Object.assign(obj, { '#text': value })
        : obj
      : value
  } else {
    for (let i =0; i < x.children.length; i++) {
      const key = x.children[i].tagName
      const currentPath = `${path}.${key}`
      const value = xmlNodeToJson(x.children[i], currentPath, rules)
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
    'eventParameters',
    CONVERSION_RULES
  ).event
  console.log(events)
  // return events != null ? events.map((e: EventParameter) => processEvent(e)) : []
  return events != null ? events.map((e: QEventDescription) => new QEvent(e)) : []
}
