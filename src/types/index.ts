export type WaveformId = {
  value?: string;
  network_code: string;
  station_code: string;
  location_code?: string;
  channel_code: string;
}

export type TimeQuantity = {
  value: string;
  _value?: Date;
  _pretty?: string
}

export type RealQuantity = {
  value: number;
  uncertainty?: number;
  _pretty?: string;
  _pretty_uncertainty?: string;
}

export type CreationInfo = {
  author: string;
  creation_time?: string;
  _creation_time?: Date;
  _pretty_creation_time?: string;
}

export type Pick = {
  public_id: string;
  time: TimeQuantity;
  waveform_id: WaveformId;
  _seedid?: string;
  _fdsnid?: string;
}

export type Arrival = {
  public_id?: string;
  time_weight: number;
  pick_id: string;
  _pick?: Pick;
  _traveltime: Date;
}

export type Origin = {
  public_id: string;
  time: TimeQuantity;
  latitude: RealQuantity;
  longitude: RealQuantity;
  depth: RealQuantity;
  region: string;
  creation_info?: CreationInfo;
  arrival?: Arrival[];
}

export type StationMagnitude = {
  public_id: string;
  amplitude_id: string;
  _amplitude?: Amplitude;
  mag: RealQuantity;
  waveform_id: WaveformId;
  _seedid?: string;
}

export type StationMagnitudeContribution = {
  station_magnitude_id: string;
  _station_magnitude?: StationMagnitude;
  residual?: number;
  _pretty_residual?: string;
  weight?: number;
  _pretty_weight?: string;
}

export type Magnitude = {
  public_id: string;
  mag: RealQuantity;
  type: string;
  creation_info?: CreationInfo;
  station_magnitude_contribution?: StationMagnitudeContribution[];
}

export type Amplitude = {
  public_id: string;
  waveform_id: WaveformId;
  _seedid?: string;
}

export type EventDescription = {
  text: string;
}

export type EventParameter = {
  public_id: string;
  origin: Origin[];
  magnitude: Magnitude[];
  amplitude?: Amplitude[];
  station_magnitude?: StationMagnitude[];
  type: string;
  preferred_origin_id?: string | null;
  preferred_magnitude_id?: string | null;
  _region?: string;
  description?: EventDescription[];
  _po?: Origin;
  _pm?: Magnitude;
  pick?: Pick[];
}

export type ConversionRules = {
  nodeList: string[];
  conversion: Record<string, undefined | ((x: string) => any)>;
}

export type AjaxOpt = {
  method: string;
  url: string;
  type: XMLHttpRequestResponseType;
  args?: string | Record<string, any>;
  dataMimeType?: string;
  data?: string;
}

export type FDSNEventParams = {
  format: string;
}

export type FDSNStationParams = {
  format: XMLHttpRequestResponseType;
}

export type FDSNStationBulkItem = [string, string, string, string, Date | string, Date | string]

export type FDSNWaveformBulkItem = [string, string, string, string, Date | string, Date | string]

export type FDSNWaveformParams = {
  network?: string;
  station?: string;
  location?: string;
  channel?: string;
  starttime?: string;
  endtime?: string;
  start?: string;
  end?: string;
}

export type TraceTimeserie = {
  starttime: number;
  endtime: number;
  data: (number | null)[];
}

export type TraceData = {
  starttime: number;
  data: (number | null)[];
}

export type TraceStats = {
  id: string;
  network: string;
  station: string;
  location?: string;
  channel: string;
  samplingRate: number;
  delta: number;
  npts: number;
  starttime: number | null;
  endtime: number | null;
}

export type FSDH = {
  seedId: string;
  starttime: number;
  npts: number;
  samplingRate: number;
  dataBegin: number;
  firstBlockette: number;
}

export type Bloquette1000 = {
  nextBloquette: number;
  encoding: number;
  littleEndian: boolean;
  packetSize: number;
}

export type MSEEDHeader = {
  fsdh?: FSDH;
  blkt1000?: Bloquette1000;
}

export type MSEEDHeaderStrict = {
  fsdh: FSDH;
  blkt1000: Bloquette1000;
}

export type UpdateParameters = {
  percent: number
}

export type UpdateFunction = (a: UpdateParameters) => void

export type TraceConstructorParameters = {
  id?: string;
  samplingRate?: number;
  data?: TraceData[];
  stats?: TraceStats;
  timeseries?: TraceTimeserie[];
}

export type Channel = {
  azimuth: number;
  dip: number;
  scale: number;
  depth: number;
  starttime: Date;
  endtime: Date;
  sample_rate: number;
  units: string;
}
export type ChannelMap = Record<string, Channel[]>
export type LocationMap = Record<string, ChannelMap>
export type Station = {
  lat: number;
  lon: number;
  alt: number;
  location: LocationMap;
}
export type StationMap = Record<string, Station>
export type Inventory = Record<string, StationMap>

export type EventDriver = {
  parse: (input: any) => EventParameter[];
}