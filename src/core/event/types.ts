class CachedProperties {
  _cache: Record<string, any>
  constructor() {
    this._cache = {}
  }
  _getCache(key: string) { return this._cache[key] }
  _setCache(key: string, value: any) { return this._cache[key] = value }
}

export class ResourceIdentifier {
  static _mainKey: string = 'base'
  static _instances: Record<string, Record<string, any>> = {}
  id: string | undefined
  constructor(publicID: string | undefined, obj?: any) {
    this.id = publicID
    if (publicID != null && obj != null) {
      if (ResourceIdentifier._instances[ResourceIdentifier._mainKey] == null) {
        ResourceIdentifier._instances[ResourceIdentifier._mainKey] = {}
      }
      if (ResourceIdentifier._instances[ResourceIdentifier._mainKey][publicID] != null) {
        console.warn(`(${ResourceIdentifier._mainKey}) overwrite object ${publicID}`)
      }
      ResourceIdentifier._instances[ResourceIdentifier._mainKey][publicID] = obj
    }
  }
  static get mainKey() {
    return ResourceIdentifier._mainKey
  }
  static set mainKey(key: string) {
    console.log(`[ResourceIdentifier] set mainKey = ${key}`)
    ResourceIdentifier._mainKey = key
  }
  get referredObject() {
    return this.id != null && ResourceIdentifier._instances[ResourceIdentifier._mainKey] != null
      ? ResourceIdentifier._instances[ResourceIdentifier._mainKey][this.id]
      : undefined
  }
}

console.log(ResourceIdentifier)

export type TypeCertainty = 'known' | 'suspected'
export type EvaluationMode = 'automatic' | 'manual'
export type EvaluationStatus = 'preliminary' | 'confirmed' | 'reviewed' | 'final' | 'rejected'

export interface CommentDescription {
  text: string
}

export interface TimeQuantityDescription {
  value: string
  uncertainty?: number
  lowerUncertainty?: number
  upperUncertainty?: number
}

export class TimeQuantity {
  desc: TimeQuantityDescription
  constructor(desc: TimeQuantityDescription) {
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

export interface RealQuantityDescription {
  value: number
  uncertainty?: number
}

export class RealQuantity {
  desc: RealQuantityDescription
  constructor(desc: RealQuantityDescription) {
    this.desc = desc
  }
  get value() { return this.desc.value }
  set value(value: number) { this.desc.value = value }
  get uncertainty() { return this.desc.uncertainty }
  set uncertainty(value: number | undefined) { this.desc.uncertainty = value }
}

export interface CreationInfoDescription {
  author?: string
  agencyID?: string
  creationTime?: string
}

export class CreationInfo {
  desc: CreationInfoDescription
  constructor(desc: CreationInfoDescription) {
    this.desc = desc
  }
  get author() { return this.desc.author }
  set author(value: string | undefined) { this.desc.author = value }
  get agencyID() { return this.desc.agencyID }
  set agencyID(value: string | undefined) { this.desc.agencyID = value }
  get creationTime() { return this.desc.creationTime }
  set creationTime(value: string | undefined) { this.desc.creationTime = value }
}

export interface WaveformIdDescription {
  '@networkCode': string
  '@stationCode': string
  '@locationCode'?: string
  '@channelCode': string
}

export class WaveformId {
  desc: WaveformIdDescription
  constructor(desc: WaveformIdDescription) {
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

export type PickOnset = 'impulsive' | 'emergent' | 'undecidable'
export type PickPolarity = 'positive' | 'negative' |  'undecidable'

export interface PickDescription {
  '@publicID': string
  time: TimeQuantityDescription
  waveformID: WaveformIdDescription
  filterID?: string
  methodID?: string
  evaluationMode: EvaluationMode
  onset?: PickOnset
  phaseHint: string
  polarity?: PickPolarity
  creationInfo?: CreationInfoDescription
}

export class Pick extends CachedProperties {
  desc: PickDescription
  id: ResourceIdentifier
  constructor (desc: PickDescription) {
    super()
    this.desc = desc
    this.id = new ResourceIdentifier(this.desc['@publicID'], this)
  }
  get publicID() { return this.desc['@publicID'] }
  get time() { return this._getCache('time') || this._setCache('time', new TimeQuantity(this.desc.time)) }
  get waveformID() { return this._getCache('waveformID') || this._setCache('waveformID', new WaveformId(this.desc.waveformID)) }
  get filterID() { return this.desc.filterID }
  set filterID(value: string | undefined) { this.desc.filterID = value }
  get methodID() { return this.desc.methodID }
  set methodID(value: string | undefined) { this.desc.methodID = value }
  get onset() { return this.desc.onset }
  set onset(value: PickOnset | undefined) { this.desc.onset = value }
  get phaseHint() { return this.desc.phaseHint }
  set phaseHint(value: string) { this.desc.phaseHint = value }
  get polarity() { return this.desc.polarity }
  set polarity(value: PickPolarity | undefined) { this.desc.polarity = value }
  get evaluationMode() { return this.desc.evaluationMode }
  set evaluationMode(value: EvaluationMode) { this.desc.evaluationMode = value }
  get creationInfo() { return this.desc.creationInfo != null ? this._getCache('creationInfo') || this._setCache('creationInfo', new CreationInfo(this.desc.creationInfo)) : undefined }
  set creationInfo(value: CreationInfoDescription) { this._setCache('creationInfo', new CreationInfo(this.desc.creationInfo = value)) }
}

export interface ArrivalDescription {
  '@publicID': string
  pickID: string
  phase: string
  azimuth?: number
  distance?: number
  takeoffAngle?: number
  timeResidual?: number
  timeWeight?: number
}

export class Arrival extends CachedProperties {
  desc: ArrivalDescription
  id: ResourceIdentifier
  constructor(desc: ArrivalDescription) {
    super()
    this.desc = desc
    this.id = new ResourceIdentifier(desc['@publicID'], this)
  }
  get publicID() { return this.desc['@publicID'] }
  get pickID() { return this._getCache('pickID') || this._setCache('pickID', new ResourceIdentifier(this.desc.pickID)) }
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

export interface AmplitudeDescription {
  '@publicID': string
  genericAmplitude: number
  pickID: string
  waveformID: WaveformIdDescription
}

export class Amplitude extends CachedProperties {
  desc: AmplitudeDescription
  id: ResourceIdentifier
  constructor(desc: AmplitudeDescription) {
    super()
    this.desc = desc
    this.id = new ResourceIdentifier(desc['@publicID'], this)
  }
  get publicID() { return this.desc['@publicID'] }
  get pickID() { return this._getCache('pickID') || this._setCache('pickID', new ResourceIdentifier(this.desc.pickID)) }
  get waveformID() { return this._getCache('waveformID') || this._setCache('waveformID', new WaveformId(this.desc.waveformID)) }
}

export interface StationMagnitudeDescription {
  '@publicID': string
  originID: string
  mag: number
  amplitudeID: string
  waveformID: WaveformIdDescription
}

export class StationMagnitude extends CachedProperties {
  desc: StationMagnitudeDescription
  id: ResourceIdentifier
  constructor(desc: StationMagnitudeDescription) {
    super()
    this.desc = desc
    this.id = new ResourceIdentifier(desc['@publicID'], this)
  }
  get publicID() { return this.desc['@publicID'] }
  get originID() { return this._getCache('originID') || this._setCache('originID', new ResourceIdentifier(this.desc.originID)) }
  get mag() { return this.desc.mag }
  get amplitudeID() { return this._getCache('amplitudeID') || this._setCache('amplitudeID', new ResourceIdentifier(this.desc.amplitudeID)) }
  get waveformID() { return this._getCache('waveformID') || this._setCache('waveformID', new WaveformId(this.desc.waveformID)) }
}

export interface StationMagnitudeContributionDescription {
  stationMagnitudeID: string
  residual: number
  weight: number
}

export class StationMagnitudeContribution extends CachedProperties {
  desc: StationMagnitudeContributionDescription
  constructor(desc: StationMagnitudeContributionDescription) {
    super()
    this.desc = desc
  }
  get stationMagnitudeID() { return this._getCache('stationMagnitudeID') || this._setCache('stationMagnitudeID', new ResourceIdentifier(this.desc.stationMagnitudeID)) }
  get residual() { return this.desc.residual }
  get weight() { return this.desc.weight }
}

export interface MagnitudeDescription {
  '@publicID': string
  mag: RealQuantityDescription
  type: string
  originID?: string
  methodID?: string
  stationCount?: number
  stationMagnitudeContribution?: StationMagnitudeContributionDescription[]
  creationInfo?: CreationInfoDescription
}

export class Magnitude extends CachedProperties {
  desc: MagnitudeDescription
  id: ResourceIdentifier
  constructor(desc: MagnitudeDescription) {
    super()
    this.desc = desc
    this.id = new ResourceIdentifier(desc['@publicID'], this)
  }
  get publicID() { return this.desc['@publicID'] }
  get mag() { return this.desc.mag }
  get type() { return this.desc.type }
  get originID() { return this._getCache('originID') || this._setCache('originID', new ResourceIdentifier(this.desc.originID)) }
  get methodID() { return this.desc.methodID }
  get stationCount() { return this.desc.stationCount }
  get stationMagnitudeContribution() { return this.desc.stationMagnitudeContribution != null ? this._getCache('stationMagnitudeContribution') || this._setCache('stationMagnitudeContribution', this.desc.stationMagnitudeContribution.map(x => new StationMagnitudeContribution(x))) : undefined }
  get creationInfo() { return this.desc.creationInfo != null ? this._getCache('creationInfo') || this._setCache('creationInfo', new CreationInfo(this.desc.creationInfo)) : undefined }
}

export interface OriginQualityDescription {
  associatedPhaseCount?: number
  usedPhaseCount?: number
  associatedStationCount?: number
  usedStationCount?: number
  standardError?: number
  azimuthalGap?: number
  minimumDistance?: number
}

export interface OriginDescription {
  '@publicID': string
  time: TimeQuantityDescription
  longitude: RealQuantityDescription
  latitude: RealQuantityDescription
  depth: RealQuantityDescription
  methodID?: string
  earthModelID?: string
  quality?: OriginQualityDescription
  region?: string
  evaluationMode?: EvaluationMode
  evaluationStatus?: EvaluationStatus
  creationInfo?: CreationInfoDescription
  arrival: ArrivalDescription[]
}

export class Origin extends CachedProperties {
  desc: OriginDescription
  id: ResourceIdentifier
  constructor(desc: OriginDescription) {
    super()
    this.desc = desc
    this.id = new ResourceIdentifier(desc['@publicID'], this)
    if (desc.arrival == null) {
      desc.arrival = []
    }
    this._setCache('arrival', this.desc.arrival.map(x => new Arrival(x)))
  }
  get publicID() { return this.desc['@publicID'] }
  get time() { return this._getCache('time') || this._setCache('time', new TimeQuantity(this.desc.time)) }
  get longitude() { return this._getCache('longitude') || this._setCache('longitude', new RealQuantity(this.desc.longitude)) }
  get latitude() { return this._getCache('latitude') || this._setCache('latitude', new RealQuantity(this.desc.latitude)) }
  get depth() { return this._getCache('depth') || this._setCache('depth', new RealQuantity(this.desc.depth)) }
  get methodID() { return this.desc.methodID }
  get earthModelID() { return this.desc.earthModelID }
  get quality() { return this.desc.quality }
  get region() { return this.desc.region }
  get evaluationMode() { return this.desc.evaluationMode }
  get evaluationStatus() { return this.desc.evaluationStatus }
  set evaluationStatus(value: EvaluationStatus | undefined) { this.desc.evaluationStatus = value }
  get creationInfo() { return this.desc.creationInfo != null ? this._getCache('creationInfo') || this._setCache('creationInfo', new CreationInfo(this.desc.creationInfo)) : undefined }
  get arrival() { return this._getCache('arrival') as Arrival[] }
  addArrival(desc: ArrivalDescription) {
    console.log('add arrival', desc.pickID)
    this.desc.arrival.push(desc)
    const arrival = new Arrival(desc)
    this.arrival.push(arrival)
    return arrival
  }
  deleteArrival(arrival: Arrival) {
    console.log('delete arrival', arrival.pickID.id)
    const foundArrival = this.arrival.find(x => x.pickID.id === arrival.pickID.id)
    if (foundArrival != null) {
      this._getCache('arrival').splice(this._getCache('arrival').indexOf(arrival), 1)
    }
    const arrivalDesc = this.desc.arrival.find(x => x.pickID === arrival.pickID.id)
    if (arrivalDesc != null) {
      this.desc.arrival.splice(this.desc.arrival.indexOf(arrivalDesc), 1)
    }
  }
}

export interface NodalPlaneDescription {
  strike: RealQuantityDescription
  dip: RealQuantityDescription
  rake: RealQuantityDescription
}

export class NodalPlane extends CachedProperties {
  desc: NodalPlaneDescription
  constructor(desc: NodalPlaneDescription) {
    super()
    this.desc = desc
  }
  get strike() { return this._getCache('strike') || this._setCache('strike', new RealQuantity(this.desc.strike)) }
  set strike(value: RealQuantityDescription) { this._setCache('strike', new RealQuantity(this.desc.strike = value)) }
  get dip() { return this._getCache('dip') || this._setCache('dip', new RealQuantity(this.desc.dip)) }
  set dip(value: RealQuantityDescription) { this._setCache('dip', new RealQuantity(this.desc.dip = value)) }
  get rake() { return this._getCache('rake') || this._setCache('rake', new RealQuantity(this.desc.rake)) }
  set rake(value: RealQuantityDescription) { this._setCache('rake', new RealQuantity(this.desc.rake = value)) }
}

export interface NodalPlanesDescription {
  nodalPlane1: NodalPlaneDescription
  nodalPlane2?: NodalPlaneDescription
}

export class NodalPlanes extends CachedProperties {
  desc: NodalPlanesDescription
  constructor(desc: NodalPlanesDescription) {
    super()
    this.desc = desc
  }
  get nodalPlane1() { return this._getCache('nodalPlane1') || this._setCache('nodalPlane1', new NodalPlane(this.desc.nodalPlane1)) }
  set nodalPlane1(value: NodalPlaneDescription) { this._setCache('nodalPlane1', new NodalPlane(this.desc.nodalPlane1 = value)) }
  get nodalPlane2() { return this.desc.nodalPlane2 != null ? this._getCache('nodalPlane2') || this._setCache('nodalPlane2', new NodalPlane(this.desc.nodalPlane2)) : undefined }
  set nodalPlane2(value: NodalPlaneDescription | undefined) { value != null ? this._setCache('nodalPlane2', new NodalPlane(this.desc.nodalPlane2 = value)) : this._setCache('nodalPlane2', this.desc.nodalPlane2 = value) }
}

export interface FocalMechanismDescription {
  '@publicID': string
  triggeringOriginID: string
  nodalPlanes: NodalPlanesDescription
  stationPolarityCount?: number
  evaluationMode?: EvaluationMode
  comment?: CommentDescription[]
}

export class FocalMechanism extends CachedProperties {
  desc: FocalMechanismDescription
  id: ResourceIdentifier
  constructor(desc: FocalMechanismDescription) {
    super()
    this.desc = desc
    this.id = new ResourceIdentifier(desc['@publicID'], this)
  }
  get publicID() { return this.desc['@publicID'] }
  get triggeringOriginID() { return this._getCache('triggeringOriginID') || this._setCache('triggeringOriginID', new ResourceIdentifier(this.desc.triggeringOriginID)) }
  get nodalPlanes() { return this._getCache('nodalPlanes') || this._setCache('nodalPlanes', new NodalPlanes(this.desc.nodalPlanes)) }
  get stationPolarityCount() { return this.desc.stationPolarityCount }
  get evaluationMode() { return this.desc.evaluationMode }
  get comment() { return this.desc.comment }
}

export interface EventDescriptionDescription {
  text: string
  type?: 'felt report' | 'Flinn-Engdahl region' | 'local time' | 'tectonic summary' | 'nearest cities' | 'earthquake name' | 'region name'
}

export interface EventDescription {
  '@publicID': string
  preferredOriginID?: string
  preferredMagnitudeID?: string
  preferredFocalMechanismID?: string
  type?: string
  typeCertainty?: TypeCertainty
  description?: EventDescriptionDescription[]
  creationInfo?: CreationInfoDescription
  origin: OriginDescription[]
  magnitude: MagnitudeDescription[]
  stationMagnitude: StationMagnitudeDescription[]
  pick: PickDescription[]
  focalMechanism: FocalMechanismDescription[]
  amplitude: AmplitudeDescription[]
}

export class Event extends CachedProperties {
  desc: EventDescription
  id: ResourceIdentifier
  constructor(desc: EventDescription) {
    super()
    this.desc = Object.assign({ origin: [], magnitude: [], stationMagnitude: [], amplitude: [], focalMechanism: [], pick: [] }, desc)
    this.id = new ResourceIdentifier(desc['@publicID'], this)
    this._setCache('pick', this.desc.pick.map(x => new Pick(x)))
    this._setCache('amplitude', this.desc.amplitude.map(x => new Amplitude(x)))
    this._setCache('origin', this.desc.origin.map(x => new Origin(x)))
    this._setCache('stationMagnitude', this.desc.stationMagnitude.map(x => new StationMagnitude(x)))
    this._setCache('magnitude', this.desc.magnitude.map(x => new Magnitude(x)))
    this._setCache('focalMechanism', this.desc.focalMechanism.map(x => new FocalMechanism(x)))
    this._setCache('preferredOriginID', new ResourceIdentifier(this.desc.preferredOriginID))
    this._setCache('preferredMagnitudeID', new ResourceIdentifier(this.desc.preferredMagnitudeID))
    this._setCache('preferredFocalMechanismID', new ResourceIdentifier(this.desc.preferredFocalMechanismID))
  }
  get publicID() { return this.desc['@publicID'] }
  get preferredOriginID(): ResourceIdentifier { return this._getCache('preferredOriginID') }
  get preferredMagnitudeID(): ResourceIdentifier { return this._getCache('preferredMagnitudeID') }
  get preferredFocalMechanismID(): ResourceIdentifier { return this._getCache('preferredFocalMechanismID') }
  get type() { return this.desc.type }
  set type(value: string | undefined) { this.desc.type = value }
  get typeCertainty() { return this.desc.typeCertainty }
  set typeCertainty(value: TypeCertainty | undefined) { this.desc.typeCertainty = value }
  get description() { return this.desc.description }
  get pick() { return this._getCache('pick') as Pick[] }
  get amplitude() { return this._getCache('amplitude') as Amplitude[] }
  get creationInfo() { return this.desc.creationInfo != null ? this._getCache('creationInfo') || this._setCache('creationInfo', new CreationInfo(this.desc.creationInfo)) : undefined }
  get origin() { return this._getCache('origin') as Origin[] }
  get magnitude() { return this._getCache('magnitude') as Magnitude[] }
  get stationMagnitude() { return this._getCache('stationMagnitude') as StationMagnitude[] }
  get focalMechanism() { return this._getCache('focalMechanism') as FocalMechanism[] }
  setPreferredOriginID(value: string | undefined) { this._setCache('preferredOriginID', new ResourceIdentifier(this.desc.preferredOriginID = value)) }
  setPreferredMagnitudeID(value: string | undefined) { this._setCache('preferredMagnitudeID', new ResourceIdentifier(this.desc.preferredMagnitudeID = value)) }
  setPreferredFocalMechanismID(value: string | undefined) { this._setCache('preferredFocalMechanismID', new ResourceIdentifier(this.desc.preferredFocalMechanismID = value)) }
  addPick(desc: PickDescription) {
    console.log('add pick', desc['@publicID'])
    this.desc.pick.push(desc)
    const pick = new Pick(desc)
    this.pick.push(pick)
    return pick
  }
  deletePick(pick: Pick) {
    console.log('delete pick', pick.publicID)
    const foundPick = this.pick.find(x => x.publicID === pick.publicID)
    if (foundPick != null) {
      this._getCache('pick').splice(this._getCache('pick').indexOf(foundPick), 1)
    }
    const pickDesc = this.desc.pick.find(x => x['@publicID'] === pick.publicID)
    if (pickDesc != null) {
      this.desc.pick.splice(this.desc.pick.indexOf(pickDesc), 1)
    }
  }
  addAmplitude(desc: AmplitudeDescription) {
    this.desc.amplitude.push(desc)
    const amplitude = new Amplitude(desc)
    this.amplitude.push(amplitude)
    return amplitude
  }
  addOrigin(desc: OriginDescription) {
    this.desc.origin.push(desc)
    const origin = new Origin(desc)
    this.origin.push(origin)
    return origin
  }
  addMagnitude(desc: MagnitudeDescription) {
    this.desc.magnitude.push(desc)
    const magnitude = new Magnitude(desc)
    this.magnitude.push(magnitude)
    return magnitude
  }
  addStationMagnitude(desc: StationMagnitudeDescription) {
    this.desc.stationMagnitude.push(desc)
    const staMag = new StationMagnitude(desc)
    this.stationMagnitude.push(staMag)
    return staMag
  }
  addFocalMechanism(desc: FocalMechanismDescription) {
    this.desc.focalMechanism.push(desc)
    const focalMechanism = new FocalMechanism(desc)
    this.focalMechanism.push(focalMechanism)
    return focalMechanism
  }
}
