# sismojs

## Usage examples

```javascript
import sismojs from './src/index.js'
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



Doc to be continued...