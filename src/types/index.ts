export type WaveformId = {
  value?: string
  network_code: string
  station_code: string
  location_code?: string
  channel_code: string
}

export type TimeQuantity = {
  value: string
  _value?: Date
  _pretty?: string
  lower_uncertainty?: number
  upper_uncertainty?: number
}

export type RealQuantity = {
  value: number
  uncertainty?: number
  _pretty?: string
  _pretty_uncertainty?: string
}

export type EvaluationMode = 'automatic' | 'manual'
export type EvaluationStatus = 'preliminary' | 'confirmed' | 'reviewed' | 'final' | 'rejected'

export type CreationInfo = {
  author: string
  agency_id: string
  creation_time?: string
  _creation_time?: Date
  _pretty_creation_time?: string
}

export type Pick = {
  public_id: string
  time: TimeQuantity
  waveform_id: WaveformId
  phase_hint: string
  _seedid: string
  _fdsnid: string
  evaluation_mode: EvaluationMode
  polarity?: string
  creation_info: CreationInfo
  filter_id?: string
}

export type Arrival = {
  public_id?: string
  time_weight: number
  pick_id: string
  phase: string
  _pick?: Pick
  _traveltime: Date
  takeoff_angle?: RealQuantity
  time_residual: number
  distance: number
  azimuth: number
}

export type OriginQuality = {
  used_phase_count?: number
  associated_phase_count?: number
  used_station_count?: number
  associated_station_count?: number
  standard_error?: number
  azimuthal_gap?: number
  minimum_distance?: number
}

export type Origin = {
  public_id: string
  time: TimeQuantity
  latitude: RealQuantity
  longitude: RealQuantity
  depth: RealQuantity
  region: string
  creation_info?: CreationInfo
  arrival?: Arrival[]
  evaluation_mode?: EvaluationMode
  evaluation_status?: EvaluationStatus | null
  quality?: OriginQuality
  method_id?: string
  earth_model_id?: string
}

export type Amplitude = {
  public_id: string
  waveform_id: WaveformId
  _seedid: string
}

export type StationMagnitude = {
  public_id: string
  amplitude_id: string
  _amplitude?: Amplitude
  mag: RealQuantity
  waveform_id: WaveformId
  _seedid: string
}

export type StationMagnitudeContribution = {
  station_magnitude_id: string
  _station_magnitude?: StationMagnitude
  residual?: number
  _pretty_residual?: string
  weight?: number
  _pretty_weight?: string
}

export type Magnitude = {
  public_id: string
  origin_id: string
  mag: RealQuantity
  type: string
  creation_info?: CreationInfo
  method_id?: string
  station_count?: number
  station_magnitude_contribution?: StationMagnitudeContribution[]
}

export type EventDescription = {
  type?: string
  text: string
}

export type NodalPlane = {
  strike: RealQuantity
  dip: RealQuantity
  rake: RealQuantity
}

export type NodalPlanes = {
  nodal_plane1: NodalPlane;
  nodal_plane2?: NodalPlane;
}

export type Comment = {
  text: string
}

export type FocalMechanism = {
  public_id: string;
  triggering_origin_id?: string;
  nodal_planes: NodalPlanes;
  station_polarity_count?: number;
  evaluation_mode?: EvaluationMode;
  comment?: Comment[];
}

export type EventParameter = {
  public_id: string
  origin: Origin[]
  magnitude: Magnitude[]
  amplitude?: Amplitude[]
  station_magnitude?: StationMagnitude[]
  type: string
  type_certainty?: string | null
  preferred_origin_id?: string | null
  preferred_magnitude_id?: string | null
  preferred_focal_mechanism_id?: string | null
  creation_info?: CreationInfo
  _region?: string
  description?: EventDescription[]
  _po?: Origin
  _pm?: Magnitude
  _pfm?: FocalMechanism
  pick?: Pick[]
  focal_mechanism?: FocalMechanism[]
}

export type ConversionRules = {
  nodeList: string[]
  conversion: Record<string, undefined | ((x: string) => any)>
}

export type FDSNEventParams = Partial<{
  format: string
  minlatitude: number
  minlongitude: number
  maxlatitude: number
  maxlongitude: number
  minmagnitude: number
  maxmagnitude: number
  minmag: number
  maxmag: number
  minlat: number
  minlon: number
  maxlat: number
  maxlon: number
  eventid: string
  includeallorigins: boolean
  includeallmagnitudes: boolean
  includearrivals: boolean
  includefocalmechanism: boolean
  includestationmagnitudes: boolean
}>

export type FDSNStationParams = {
  format: string
  minlatitude: number
  minlongitude: number
  maxlatitude: number
  maxlongitude: number
  minmagnitude: number
  maxmagnitude: number
  minlat: number
  minlon: number
  maxlat: number
  maxlon: number
  latitude: number
  longitude: number
  lat: number
  lon: number
  minradius: number
  maxradius: number
}

export type FDSNStationBulkItem = [string, string, string, string, Date | string, Date | string]

export type FDSNWaveformBulkItem = [string, string, string, string, Date | string, Date | string]

export type FDSNWaveformParams = {
  network?: string
  station?: string
  location?: string
  channel?: string
  starttime?: string
  endtime?: string
  start?: string
  end?: string
}

export type TraceTimeserie = {
  starttime: number
  endtime: number
  data: (number | null)[]
}

export type TraceData = {
  starttime: number
  data: (number | null)[]
}

export type TraceStats = {
  id: string
  network: string
  station: string
  location?: string
  channel: string
  samplingRate: number
  delta: number
  npts: number
  starttime: number | null
  endtime: number | null
}

export type FSDH = {
  seedId: string
  starttime: number
  npts: number
  samplingRate: number
  dataBegin: number
  firstBlockette: number
}

export type Bloquette1000 = {
  nextBloquette: number
  encoding: number
  littleEndian: boolean
  packetSize: number
}

export type MSEEDHeader = {
  fsdh?: FSDH
  blkt1000?: Bloquette1000
}

export type MSEEDHeaderStrict = {
  fsdh: FSDH
  blkt1000: Bloquette1000
}

export type UpdateParameters = {
  percent: number
}

export type UpdateFunction = (a: UpdateParameters) => void

export type TraceConstructorParameters = {
  id?: string
  samplingRate?: number
  data?: TraceData[]
  stats?: TraceStats
  timeseries?: TraceTimeserie[]
}

export type Channel = {
  azimuth: number
  dip: number
  scale: number
  depth: number
  starttime: Date
  endtime: Date
  sample_rate: number
  units: string
}
export type ChannelMap = Record<string, Channel[]>
export type LocationMap = Record<string, ChannelMap>
export type Station = {
  lat: number
  lon: number
  alt: number
  location: LocationMap
}
export type StationMap = Record<string, Station>
export type Inventory = Record<string, StationMap>

export type EventDriver = {
  parse: (input: any) => EventParameter[]
}
