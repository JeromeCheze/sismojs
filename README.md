[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

# sismojs

The `sismojs` library is a Typescript library inspired by the [ObsPy](https://github.com/obspy/obspy/wiki) library. It provides a set of tools to interact with the [FDSN webservice](https://www.fdsn.org/webservice) and to manipulate seismic data (MSEED, QUAKEML, StationXML, etc.) within the browser.

## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.

## Usage examples

```typescript
import sismojs from './src/index.ts'
let client = new sismojs.fdsn.Client('.')

/**
 * WAVEFORMS
 */
// this method perform a GET request to the dataselect service of the FDSN webservice
client.getWaveforms({
    station: 'ISO',
    channel: 'HH?',
    starttime: '2019-12-20T00:00:00',
    endtime: '2019-12-20T00:10:00'
}).then(st => {
    // st is an instance of sismojs.core.Stream
    console.log(st)
    for (let tr of st.traces) {
        // tr is an instance of sismojs.core.Trace (similar to obspy.core.Trace)
        let data = tr.data
        let start = tr.stats.starttime
        let sampling_rate = tr.stats.sampling_rate
        let station = tr.stats.station
        let seedid = tr.stats.id
        // ...
    }
})

// this method perform a POST request to the dataselect service of the FDSN webservice
client.getWaveformsBulk([
    ['FR', 'ISO', '00', 'HH?', '2019-12-20T00:00:00', '2019-12-20T00:10:00'],
    ['FR', 'CALF', '00', '*', '2019-12-20T00:00:00', '2019-12-20T00:10:00']
]).then(st => {
    // ...
})
```
