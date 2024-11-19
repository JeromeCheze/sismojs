class CachedProperties {
  _cache: Record<string, any>
  constructor() {
    this._cache = {}
  }
  _getCache(key: string) { return this._cache[key] }
  _setCache(key: string, value: any) { return this._cache[key] = value }
}

export class QResourceIdentifier {
  static _mainKey: string = 'base'
  static _instances: Record<string, Record<string, any>> = {}
  id: string | undefined
  constructor(publicID: string | undefined, obj?: any) {
    this.id = publicID
    if (publicID != null && obj != null) {
      if ( QResourceIdentifier._instances[QResourceIdentifier._mainKey] == null) {
        QResourceIdentifier._instances[QResourceIdentifier._mainKey] = {}
      }
      if ( QResourceIdentifier._instances[QResourceIdentifier._mainKey][publicID] != null) {
        console.warn(`(${ QResourceIdentifier._mainKey}) overwrite object ${publicID}`)
      }
      QResourceIdentifier._instances[QResourceIdentifier._mainKey][publicID] = obj
    }
  }
  static get mainKey() {
    return QResourceIdentifier._mainKey
  }
  static set mainKey(key: string) {
    console.log(`[QResourceIdentifier] set mainKey = ${key}`)
    QResourceIdentifier._mainKey = key
  }
  get referredObject() {
    return this.id != null && QResourceIdentifier._instances[QResourceIdentifier._mainKey] != null
      ? QResourceIdentifier._instances[QResourceIdentifier._mainKey][this.id]
      : undefined
  }
}

// console.log(QResourceIdentifier)

export type QTypeCertainty = 'known' | 'suspected'
export type QEvaluationMode = 'automatic' | 'manual'
export type QEvaluationStatus = 'preliminary' | 'confirmed' | 'reviewed' | 'final' | 'rejected'

export interface QCommentDescription {
  text: string
}

export interface QTimeQuantityDescription {
  value: string
  uncertainty?: number
  lowerUncertainty?: number
  upperUncertainty?: number
}

export class QTimeQuantity {
  desc: QTimeQuantityDescription
  constructor(desc: QTimeQuantityDescription) {
    this.desc = desc
    this.desc.value = this.object.toISOString()
  }
  get value() { return this.desc.value }
  set value(value: string) { this.desc.value = value }
  get uncertainty() { return this.desc.uncertainty }
  set uncertainty(value: number | undefined) { this.desc.uncertainty = value }
  get lowerUncertainty() { return this.desc.lowerUncertainty }
  set lowerUncertainty(value: number | undefined) { this.desc.lowerUncertainty = value }
  get upperUncertainty() { return this.desc.upperUncertainty }
  set upperUncertainty(value: number | undefined) { this.desc.upperUncertainty = value }
  get object() { return new Date(Date.parse(this.value)) }
  get pretty() { return this.value != null ? this.value.replace('T', ' ').slice(0, 19) : this.value }
}

export interface QRealQuantityDescription {
  value: number
  uncertainty?: number
}

export class QRealQuantity {
  desc: QRealQuantityDescription
  constructor(desc: QRealQuantityDescription) {
    this.desc = desc
  }
  get value() { return this.desc.value }
  set value(value: number) { this.desc.value = value }
  get uncertainty() { return this.desc.uncertainty }
  set uncertainty(value: number | undefined) { this.desc.uncertainty = value }
}

export interface QCreationInfoDescription {
  author?: string
  agencyID?: string
  creationTime?: string
}

export class QCreationInfo {
  desc: QCreationInfoDescription
  constructor(desc: QCreationInfoDescription) {
    this.desc = desc
  }
  get author() { return this.desc.author }
  set author(value: string | undefined) { this.desc.author = value }
  get agencyID() { return this.desc.agencyID }
  set agencyID(value: string | undefined) { this.desc.agencyID = value }
  get creationTime() { return this.desc.creationTime }
  set creationTime(value: string | undefined) { this.desc.creationTime = value }
}

export interface QWaveformIdDescription {
  '@networkCode': string
  '@stationCode': string
  '@locationCode'?: string
  '@channelCode': string
}

export class QWaveformId {
  desc: QWaveformIdDescription
  constructor(desc: QWaveformIdDescription) {
    this.desc = desc
  }
  get networkCode() { return this.desc['@networkCode'] }
  get stationCode() { return this.desc['@stationCode'] }
  get locationCode() { return this.desc['@locationCode'] }
  get channelCode() { return this.desc['@channelCode'] }
  get netsta() { return [this.desc['@networkCode'], this.desc['@stationCode']].join('.') }
  get seedid() { return [this.desc['@networkCode'], this.desc['@stationCode'], this.desc['@locationCode'] || '', this.desc['@channelCode']].join('.') }
  get fdsnid() { return this.seedid.replace('..', '.--.') }
}

export type QPickOnset = 'impulsive' | 'emergent' | 'undecidable'
export type QPickPolarity = 'positive' | 'negative' |  'undecidable'

export interface QPickDescription {
  '@publicID': string
  time: QTimeQuantityDescription
  waveformID: QWaveformIdDescription
  filterID?: string
  methodID?: string
  evaluationMode: QEvaluationMode
  onset?: QPickOnset
  phaseHint: string
  polarity?: QPickPolarity
  creationInfo?: QCreationInfoDescription
}

export class QPick extends CachedProperties {
  desc: QPickDescription
  id: QResourceIdentifier
  parent: QResourceIdentifier
  constructor (desc: QPickDescription, parent: QResourceIdentifier) {
    super()
    this.desc = desc
    this.id = new QResourceIdentifier(this.desc['@publicID'], this)
    this.parent = parent
  }
  get publicID() { return this.desc['@publicID'] }
  get time() { return this._getCache('time') || this._setCache('time', new QTimeQuantity(this.desc.time)) }
  get waveformID() { return this._getCache('waveformID') || this._setCache('waveformID', new QWaveformId(this.desc.waveformID)) }
  get filterID() { return this.desc.filterID }
  set filterID(value: string | undefined) { this.desc.filterID = value }
  get methodID() { return this.desc.methodID }
  set methodID(value: string | undefined) { this.desc.methodID = value }
  get onset() { return this.desc.onset }
  set onset(value: QPickOnset | undefined) { this.desc.onset = value }
  get phaseHint() { return this.desc.phaseHint }
  set phaseHint(value: string) { this.desc.phaseHint = value }
  get polarity() { return this.desc.polarity }
  set polarity(value: QPickPolarity | undefined) { this.desc.polarity = value }
  get evaluationMode() { return this.desc.evaluationMode }
  set evaluationMode(value: QEvaluationMode) { this.desc.evaluationMode = value }
  get creationInfo() { return this.desc.creationInfo != null ? this._getCache('creationInfo') || this._setCache('creationInfo', new QCreationInfo(this.desc.creationInfo)) : undefined }
  set creationInfo(value: QCreationInfoDescription | undefined) { this._setCache('creationInfo', value != null ? new QCreationInfo(this.desc.creationInfo = value) : undefined) }
}

export interface QArrivalDescription {
  '@publicID': string
  pickID: string
  phase: string
  azimuth?: number
  distance?: number
  takeoffAngle?: number
  timeResidual?: number
  timeWeight?: number
}

export class QArrival extends CachedProperties {
  desc: QArrivalDescription
  id: QResourceIdentifier
  parent: QResourceIdentifier
  constructor(desc: QArrivalDescription, parent: QResourceIdentifier) {
    super()
    this.desc = desc
    this.id = new QResourceIdentifier(desc['@publicID'], this)
    this.parent = parent
  }
  get publicID() { return this.desc['@publicID'] }
  get pickID() { return this._getCache('pickID') || this._setCache('pickID', new QResourceIdentifier(this.desc.pickID)) }
  get phase() { return this.desc.phase }
  get azimuth() { return this.desc.azimuth }
  set azimuth(value: number | undefined) { this.desc.azimuth = value }
  get distance() { return this.desc.distance }
  set distance(value: number | undefined) { this.desc.distance = value }
  get takeoffAngle() { return this.desc.takeoffAngle }
  set takeoffAngle(value: number | undefined) { this.desc.takeoffAngle = value }
  get timeResidual() { return this.desc.timeResidual }
  set timeResidual(value: number | undefined) { this.desc.timeResidual = value }
  get timeWeight() { return this.desc.timeWeight }
  set timeWeight(value: number | undefined) { this.desc.timeWeight = value }
}

export interface QAmplitudeDescription {
  '@publicID': string
  genericAmplitude: number
  pickID: string
  waveformID: QWaveformIdDescription
}

export class QAmplitude extends CachedProperties {
  desc: QAmplitudeDescription
  id: QResourceIdentifier
  parent: QResourceIdentifier
  constructor(desc: QAmplitudeDescription, parent: QResourceIdentifier) {
    super()
    this.desc = desc
    this.id = new QResourceIdentifier(desc['@publicID'], this)
    this.parent = parent
  }
  get publicID() { return this.desc['@publicID'] }
  get pickID() { return this._getCache('pickID') || this._setCache('pickID', new QResourceIdentifier(this.desc.pickID)) }
  get waveformID() { return this._getCache('waveformID') || this._setCache('waveformID', new QWaveformId(this.desc.waveformID)) }
}

export interface QStationMagnitudeDescription {
  '@publicID': string
  originID: string
  mag: number
  amplitudeID: string
  waveformID: QWaveformIdDescription
}

export class QStationMagnitude extends CachedProperties {
  desc: QStationMagnitudeDescription
  id: QResourceIdentifier
  parent: QResourceIdentifier
  constructor(desc: QStationMagnitudeDescription, parent: QResourceIdentifier) {
    super()
    this.desc = desc
    this.id = new QResourceIdentifier(desc['@publicID'], this)
    this.parent = parent
  }
  get publicID() { return this.desc['@publicID'] }
  get originID() { return this._getCache('originID') || this._setCache('originID', new QResourceIdentifier(this.desc.originID)) }
  get mag() { return this.desc.mag }
  get amplitudeID() { return this._getCache('amplitudeID') || this._setCache('amplitudeID', new QResourceIdentifier(this.desc.amplitudeID)) }
  get waveformID() { return this._getCache('waveformID') || this._setCache('waveformID', new QWaveformId(this.desc.waveformID)) }
}

export interface QStationMagnitudeContributionDescription {
  stationMagnitudeID: string
  residual: number
  weight: number
}

export class QStationMagnitudeContribution extends CachedProperties {
  desc: QStationMagnitudeContributionDescription
  constructor(desc: QStationMagnitudeContributionDescription) {
    super()
    this.desc = desc
  }
  get stationMagnitudeID() { return this._getCache('stationMagnitudeID') || this._setCache('stationMagnitudeID', new QResourceIdentifier(this.desc.stationMagnitudeID)) }
  get residual() { return this.desc.residual }
  get weight() { return this.desc.weight }
}

export interface QMagnitudeDescription {
  '@publicID': string
  mag: QRealQuantityDescription
  type: string
  originID?: string
  methodID?: string
  stationCount?: number
  stationMagnitudeContribution?: QStationMagnitudeContributionDescription[]
  creationInfo?: QCreationInfoDescription
}

export class QMagnitude extends CachedProperties {
  desc: QMagnitudeDescription
  id: QResourceIdentifier
  parent: QResourceIdentifier
  constructor(desc: QMagnitudeDescription, parent: QResourceIdentifier) {
    super()
    this.desc = desc
    this.id = new QResourceIdentifier(desc['@publicID'], this)
    this.parent = parent
  }
  get publicID() { return this.desc['@publicID'] }
  get mag() { return this.desc.mag }
  get type() { return this.desc.type }
  get originID() { return this._getCache('originID') || this._setCache('originID', new QResourceIdentifier(this.desc.originID)) }
  get methodID() { return this.desc.methodID }
  get stationCount() { return this.desc.stationCount }
  get stationMagnitudeContribution() { return this.desc.stationMagnitudeContribution != null ? this._getCache('stationMagnitudeContribution') || this._setCache('stationMagnitudeContribution', this.desc.stationMagnitudeContribution.map(x => new QStationMagnitudeContribution(x))) : undefined }
  get creationInfo() { return this.desc.creationInfo != null ? this._getCache('creationInfo') || this._setCache('creationInfo', new QCreationInfo(this.desc.creationInfo)) : undefined }
}

export interface QOriginQualityDescription {
  associatedPhaseCount?: number
  usedPhaseCount?: number
  associatedStationCount?: number
  usedStationCount?: number
  standardError?: number
  azimuthalGap?: number
  minimumDistance?: number
}

export interface QOriginDescription {
  '@publicID': string
  time: QTimeQuantityDescription
  longitude: QRealQuantityDescription
  latitude: QRealQuantityDescription
  depth: QRealQuantityDescription
  methodID?: string
  earthModelID?: string
  quality?: QOriginQualityDescription
  region?: string
  evaluationMode?: QEvaluationMode
  evaluationStatus?: QEvaluationStatus
  creationInfo?: QCreationInfoDescription
  arrival: QArrivalDescription[]
}

export class QOrigin extends CachedProperties {
  desc: QOriginDescription
  id: QResourceIdentifier
  parent: QResourceIdentifier
  constructor(desc: QOriginDescription, parent: QResourceIdentifier) {
    super()
    this.desc = desc
    this.id = new QResourceIdentifier(desc['@publicID'], this)
    if (desc.arrival == null) {
      desc.arrival = []
    }
    this._setCache('arrival', this.desc.arrival.map(x => new QArrival(x, this.id)))
    this.parent = parent
  }
  get publicID() { return this.desc['@publicID'] }
  get time() { return this._getCache('time') || this._setCache('time', new QTimeQuantity(this.desc.time)) }
  get longitude() { return this._getCache('longitude') || this._setCache('longitude', new QRealQuantity(this.desc.longitude)) }
  get latitude() { return this._getCache('latitude') || this._setCache('latitude', new QRealQuantity(this.desc.latitude)) }
  get depth() { return this._getCache('depth') || this._setCache('depth', new QRealQuantity(this.desc.depth)) }
  get methodID() { return this.desc.methodID }
  get earthModelID() { return this.desc.earthModelID }
  get quality() { return this.desc.quality }
  get region() { return this.desc.region }
  get evaluationMode() { return this.desc.evaluationMode }
  get evaluationStatus() { return this.desc.evaluationStatus }
  set evaluationStatus(value: QEvaluationStatus | undefined) { this.desc.evaluationStatus = value }
  get creationInfo() { return this.desc.creationInfo != null ? this._getCache('creationInfo') || this._setCache('creationInfo', new QCreationInfo(this.desc.creationInfo)) : undefined }
  get arrival() { return this._getCache('arrival') as QArrival[] }
  setTime(desc: QTimeQuantityDescription) {
    this._setCache('time', new QTimeQuantity(this.desc.time = desc))
  }
  addArrival(desc: QArrivalDescription) {
    this.desc.arrival.push(desc)
    const arrival = new QArrival(desc, this.id)
    this.arrival.push(arrival)
    console.log(`[QOrigin] (${this.id.id}) add arrival: ${JSON.stringify(arrival.desc)}`)
    return arrival
  }
  deleteArrival(arrival: QArrival) {
    console.log(`[QOrigin] (${this.id.id}) delete arrival: ${JSON.stringify(arrival.desc)}`)
    const foundArrival = this.arrival.find(x => x.pickID.id === arrival.pickID.id)
    if (foundArrival != null) {
      this._getCache('arrival').splice(this._getCache('arrival').indexOf(foundArrival), 1)
    }
    const arrivalDesc = this.desc.arrival.find(x => x.pickID === arrival.pickID.id)
    if (arrivalDesc != null) {
      this.desc.arrival.splice(this.desc.arrival.indexOf(arrivalDesc), 1)
    }
  }
}

export interface QNodalPlaneDescription {
  strike: QRealQuantityDescription
  dip: QRealQuantityDescription
  rake: QRealQuantityDescription
}

export class QNodalPlane extends CachedProperties {
  desc: QNodalPlaneDescription
  constructor(desc: QNodalPlaneDescription) {
    super()
    this.desc = desc
  }
  get strike() { return this._getCache('strike') || this._setCache('strike', new QRealQuantity(this.desc.strike)) }
  set strike(value: QRealQuantityDescription) { this._setCache('strike', new QRealQuantity(this.desc.strike = value)) }
  get dip() { return this._getCache('dip') || this._setCache('dip', new QRealQuantity(this.desc.dip)) }
  set dip(value: QRealQuantityDescription) { this._setCache('dip', new QRealQuantity(this.desc.dip = value)) }
  get rake() { return this._getCache('rake') || this._setCache('rake', new QRealQuantity(this.desc.rake)) }
  set rake(value: QRealQuantityDescription) { this._setCache('rake', new QRealQuantity(this.desc.rake = value)) }
}

export interface QNodalPlanesDescription {
  nodalPlane1: QNodalPlaneDescription
  nodalPlane2?: QNodalPlaneDescription
}

export class QNodalPlanes extends CachedProperties {
  desc: QNodalPlanesDescription
  constructor(desc: QNodalPlanesDescription) {
    super()
    this.desc = desc
  }
  get nodalPlane1() { return this._getCache('nodalPlane1') || this._setCache('nodalPlane1', new QNodalPlane(this.desc.nodalPlane1)) }
  set nodalPlane1(value: QNodalPlaneDescription) { this._setCache('nodalPlane1', new QNodalPlane(this.desc.nodalPlane1 = value)) }
  get nodalPlane2() { return this.desc.nodalPlane2 != null ? this._getCache('nodalPlane2') || this._setCache('nodalPlane2', new QNodalPlane(this.desc.nodalPlane2)) : undefined }
  set nodalPlane2(value: QNodalPlaneDescription | undefined) { value != null ? this._setCache('nodalPlane2', new QNodalPlane(this.desc.nodalPlane2 = value)) : this._setCache('nodalPlane2', this.desc.nodalPlane2 = value) }
}

export interface QFocalMechanismDescription {
  '@publicID': string
  triggeringOriginID: string
  nodalPlanes: QNodalPlanesDescription
  stationPolarityCount?: number
  misfit?: number
  methodID?: string
  stationDistributionRatio?: number
  evaluationMode?: QEvaluationMode
  comment?: QCommentDescription[]
}

export class QFocalMechanism extends CachedProperties {
  desc: QFocalMechanismDescription
  id: QResourceIdentifier
  parent: QResourceIdentifier
  constructor(desc: QFocalMechanismDescription, parent: QResourceIdentifier) {
    super()
    this.desc = desc
    this.id = new QResourceIdentifier(desc['@publicID'], this)
    this.parent = parent
  }
  get publicID() { return this.desc['@publicID'] }
  get triggeringOriginID() { return this._getCache('triggeringOriginID') || this._setCache('triggeringOriginID', new QResourceIdentifier(this.desc.triggeringOriginID)) }
  get nodalPlanes() { return this._getCache('nodalPlanes') || this._setCache('nodalPlanes', new QNodalPlanes(this.desc.nodalPlanes)) }
  get stationPolarityCount() { return this.desc.stationPolarityCount }
  get evaluationMode() { return this.desc.evaluationMode }
  get misfit() { return this.desc.misfit }
  get methodID() { return this.desc.methodID }
  get stationDistributionRatio() { return this.desc.stationDistributionRatio }
  get comment() { return this.desc.comment }
}

export interface QEventDescriptionDescription {
  text: string
  type?: 'felt report' | 'Flinn-Engdahl region' | 'local time' | 'tectonic summary' | 'nearest cities' | 'earthquake name' | 'region name'
}

export interface QEventDescription {
  '@publicID': string
  preferredOriginID?: string
  preferredMagnitudeID?: string
  preferredFocalMechanismID?: string
  type?: string
  typeCertainty?: QTypeCertainty
  description?: QEventDescriptionDescription[]
  creationInfo?: QCreationInfoDescription
  origin: QOriginDescription[]
  magnitude: QMagnitudeDescription[]
  stationMagnitude: QStationMagnitudeDescription[]
  pick: QPickDescription[]
  focalMechanism: QFocalMechanismDescription[]
  amplitude: QAmplitudeDescription[]
}

export class QEvent extends CachedProperties {
  desc: QEventDescription
  id: QResourceIdentifier
  constructor(desc: QEventDescription) {
    super()
    this.desc = Object.assign({ origin: [], magnitude: [], stationMagnitude: [], amplitude: [], focalMechanism: [], pick: [] }, desc)
    this.id = new QResourceIdentifier(desc['@publicID'], this)
    this._setCache('pick', this.desc.pick.map(x => new QPick(x, this.id)))
    this._setCache('amplitude', this.desc.amplitude.map(x => new QAmplitude(x, this.id)))
    this._setCache('origin', this.desc.origin.map(x => new QOrigin(x, this.id)))
    this._setCache('stationMagnitude', this.desc.stationMagnitude.map(x => new QStationMagnitude(x, this.id)))
    this._setCache('magnitude', this.desc.magnitude.map(x => new QMagnitude(x, this.id)))
    this._setCache('focalMechanism', this.desc.focalMechanism.map(x => new QFocalMechanism(x, this.id)))
    this._setCache('preferredOriginID', new QResourceIdentifier(this.desc.preferredOriginID))
    this._setCache('preferredMagnitudeID', new QResourceIdentifier(this.desc.preferredMagnitudeID))
    this._setCache('preferredFocalMechanismID', new QResourceIdentifier(this.desc.preferredFocalMechanismID))
  }
  get publicID() { return this.desc['@publicID'] }
  get preferredOriginID(): QResourceIdentifier { return this._getCache('preferredOriginID') }
  get preferredMagnitudeID(): QResourceIdentifier { return this._getCache('preferredMagnitudeID') }
  get preferredFocalMechanismID(): QResourceIdentifier { return this._getCache('preferredFocalMechanismID') }
  get type() { return this.desc.type }
  set type(value: string | undefined) { this.desc.type = value }
  get typeCertainty() { return this.desc.typeCertainty }
  set typeCertainty(value: QTypeCertainty | undefined) { this.desc.typeCertainty = value }
  get description() { return this.desc.description }
  get pick() { return this._getCache('pick') as QPick[] }
  get amplitude() { return this._getCache('amplitude') as QAmplitude[] }
  get creationInfo() { return this.desc.creationInfo != null ? this._getCache('creationInfo') || this._setCache('creationInfo', new QCreationInfo(this.desc.creationInfo)) : undefined }
  get origin() { return this._getCache('origin') as QOrigin[] }
  get magnitude() { return this._getCache('magnitude') as QMagnitude[] }
  get stationMagnitude() { return this._getCache('stationMagnitude') as QStationMagnitude[] }
  get focalMechanism() { return this._getCache('focalMechanism') as QFocalMechanism[] }
  setPreferredOriginID(value: string | undefined) { this._setCache('preferredOriginID', new QResourceIdentifier(this.desc.preferredOriginID = value)) }
  setPreferredMagnitudeID(value: string | undefined) { this._setCache('preferredMagnitudeID', new QResourceIdentifier(this.desc.preferredMagnitudeID = value)) }
  setPreferredFocalMechanismID(value: string | undefined) { this._setCache('preferredFocalMechanismID', new QResourceIdentifier(this.desc.preferredFocalMechanismID = value)) }
  addPick(desc: QPickDescription) {
    this.desc.pick.push(desc)
    const pick = new QPick(desc, this.id)
    this.pick.push(pick)
    console.log(`[QEvent] (${this.id.id}) add pick: ${JSON.stringify(pick.desc)}`)
    return pick
  }
  deletePick(pick: QPick) {
    console.log(`[QEvent] (${this.id.id}) delete pick: ${JSON.stringify(pick.desc)}`)
    const pickFound = this.pick.find(x => x.publicID === pick.publicID)
    if (pickFound != null) {
      this._getCache('pick').splice(this._getCache('pick').indexOf(pickFound), 1)
    }
    const pickDesc = this.desc.pick.find(x => x['@publicID'] === pick.publicID)
    if (pickDesc != null) {
      this.desc.pick.splice(this.desc.pick.indexOf(pickDesc), 1)
    }
  }
  addAmplitude(desc: QAmplitudeDescription) {
    this.desc.amplitude.push(desc)
    const amplitude = new QAmplitude(desc, this.id)
    this.amplitude.push(amplitude)
    console.log(`[QEvent] (${this.id.id}) add amplitude: ${JSON.stringify(amplitude.desc)}`)
    return amplitude
  }
  addOrigin(desc: QOriginDescription) {
    this.desc.origin.push(desc)
    const origin = new QOrigin(desc, this.id)
    this.origin.push(origin)
    console.log(`[QEvent] (${this.id.id}) add origin: ${JSON.stringify(origin.desc)}`)
    return origin
  }
  addMagnitude(desc: QMagnitudeDescription) {
    this.desc.magnitude.push(desc)
    const magnitude = new QMagnitude(desc, this.id)
    this.magnitude.push(magnitude)
    console.log(`[QEvent] (${this.id.id}) add magnitude: ${JSON.stringify(magnitude.desc)}`)
    return magnitude
  }
  addStationMagnitude(desc: QStationMagnitudeDescription) {
    this.desc.stationMagnitude.push(desc)
    const staMag = new QStationMagnitude(desc, this.id)
    this.stationMagnitude.push(staMag)
    console.log(`[QEvent] (${this.id.id}) add stationMagnitude: ${JSON.stringify(staMag.desc)}`)
    return staMag
  }
  addFocalMechanism(desc: QFocalMechanismDescription) {
    this.desc.focalMechanism.push(desc)
    const focalMechanism = new QFocalMechanism(desc, this.id)
    this.focalMechanism.push(focalMechanism)
    console.log(`[QEvent] (${this.id.id}) add focalMechanism: ${JSON.stringify(focalMechanism.desc)}`)
    return focalMechanism
  }
  clearFocalMechanism() {
    console.log(`[QEvent] (${this.id.id}) clear focalMechanism`)
    this.desc.focalMechanism = []
    this._setCache('focalMechanism', this.desc.focalMechanism.map(x => new QFocalMechanism(x, this.id)))
  }
}
