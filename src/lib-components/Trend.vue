<template>
<i></i>
</template>
<script>

import _ from 'lodash'
import downsample from '../downsample.js'

export default {
  name: 'trend',
  props: {
    label: {
      type: String,
      default: ''
    },
    path: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: '#33F'
    },
    backgroundColor: {
      type: [Boolean, String],
      default: false
    },
    width: {
      type: Number,
      default: 2
    },
    marker: {
      type: String,
      default: 'none'
    },
    markerSize: {
      type: Number,
      default: 2
    },
    context: {
      type: String,
      default: ''
    },
    stepped: {
      type: Boolean,
      default: false
    },
    line: {
      type: Boolean,
      default: true
    },
    dash: {
      type: Array,
      default: []
    },
    nothresh: {
      type: Boolean,
      default: false
    },
    recorded: {
      type: Boolean,
      default: false
    },
    atTimes: {
      type: Array,
      default: []
    },
    summary: {
      type: Boolean,
      default: false
    },
    summaryInterval: {
      type: String,
      default: '1 month'
    },
    summaryType: {
      default: 'total'
    },
    interpolated: {
      type: Boolean,
      default: false
    },
    interpolationInterval: {
      type: String,
      default: '300s'
    },
    plotInterval: {
      type: Number,
      default: 250, 
    },
    data: {
      type: [Array, Promise],
      default: null
    },
    order: {
      type: Number,
      default: 1
    },
    downsample: {
      type: Number,
      default: 0
    },
    fill: {
      type: Boolean,
      default: false
    },
    clamp: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      seriesData: []
    }
  },
  computed: {
    uid() {
      return _.uniqueId()
    },
    pipath () {
      if (this.context == '') {
        return this.path
      } else {
        return this.$pi.parse(this.path, this.context)
      }
    },
    dataset () {
      return {
        label: this.label,
        borderColor: this.color,
        backgroundColor: this.backgroundColor ? this.backgroundColor : this.color,
        data: this.seriesData,
        fill: this.fill,
        borderWidth: this.width,
        borderDash: this.borderDash,
        clip: this.markerSize,
        pointRadius: this.marker == 'none' ? 0 : this.markerSize,
        pointStyle: this.marker,
        showLine: this.line,
        interpolate: this.line,
        stepped: this.stepped,
        noThresh: this.nothresh,
        order: this.order,
        clamp: this.clamp,
        barThickness: 'flex'
      }
    },

    reloadTrigger () {
      // props that trigger a dataset reload when mutated
      return {
        data: this.data,
        path: this.pipath,
        recorded: this.recorded,
        interpolated: this.interpolated,
        summary: this.summary,
        summary_interval: this.summaryInterval,
        summary_type: this.summaryType
      }
    }
  },
  watch: {
    dataset () {
      this.$parent.updateData(this.uid, this.dataset, 'trend')
    },
    reloadTrigger () {
      this.requestLoad()
    },
    '$parent.chartStart' () {
      this.requestLoad()
    },
    '$parent.chartEnd' () {
      this.requestLoad()
    }
  },

  created () {
    this.requestLoad = _.debounce(function () {
      this.loadData()
    }, 50)
  },
  mounted () {
    this.$parent.updateData(this.uid, this.dataset, 'trend')
    // wait a tick to load data to get the rest of the chart to initialize
    this.$nextTick(function () {
      this.requestLoad()
    }.bind(this))
  },
  beforeUnmount () {
    this.$parent.deleteData(this.uid, this.dataset, 'trend')
  },
  methods: {
    async loadData () {

      if (this.data !== null) {
        if (Promise.resolve(this.data) == this.data) {
          this.seriesData = await this.data
        } else {
          this.seriesData = this.data
        }
        return
      }

      this.$parent.setLoading(this.uid, 'trend')

      // use a request token to check if we need to cancel this method as Promises cannot really be cancelled (yet)
      var requestToken = Math.random()
      this.$options.requestToken = requestToken

      var path = this.pipath

      try {
        if (this.interpolated) {
          if(this.atTimes.length == 0) {
            var response = await this.$pi.getInterpolated(path, this.$parent.chartStart, this.$parent.chartEnd, this.interpolationInterval)
          } else {
            var response = await this.$pi.getInterpolatedAtTimes(path, this.atTimes)

          }
        } else if (this.summary) {
          var response = await this.$pi.getSummary(path, this.$parent.chartStart, this.$parent.chartEnd, this.summaryInterval, 'Total')
        } else if (this.recorded) {
          if(this.atTimes.length == 0) {
            var response = await this.$pi.getRecorded(path, this.$parent.chartStart, this.$parent.chartEnd)
          } else {
            var response = await this.$pi.getRecordedAtTimes(path, this.atTimes)
          }
        } else {
          var response = await this.$pi.getPlot(path, this.$parent.chartStart, this.$parent.chartEnd, this.plotInterval)
        }
      } catch (e) {
        this.$parent.setFinished(this.uid, 'trend')
        return
      }

      const seriesData = []

      for (var i = 0; i < response.length; i++) {
        var val = response[i].Value
        var ts = response[i].Timestamp
        if (val === null) { continue }
        if (typeof (val) === 'object') {
          if (val.IsSystem) {
            continue
          }
          // val = val.Value * 24
          // ts = response[i].Value.Timestamp
          val = val.Value
        }

        seriesData.push({
          x: (new Date(ts)),
          y: val
        })
      }

      const mean = _.meanBy(seriesData, 'y')

      if (this.downsample > 0) {
        this.seriesData = downsample(seriesData, this.downsample)
      } else {
        this.seriesData = seriesData
      }

      // remove extreme outliers
      if (this.clamp) {
        for (var val of seriesData) {
          if (val.y > 10 * mean) {
            val.y = NaN
          }
        }
      }

      this.$parent.setFinished(this.uid, 'trend')
    }
  }
}
</script>
<style>
</style>

