<template>
</template>
<script>
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
    nothresh: {
      type: Boolean,
      default: false
    },
    recorded: {
      type: Boolean,
      default: false
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
    data: {
      type: [Array, Promise],
      default: null
    },
    order: {
      type: Number,
      default: 0,
    }
  },
  data() {
    return {
      seriesData: []
    }
  },
  computed: {
    pipath () {
      if (this.context == '') {
        return this.path
      } else {
        return this.$pi.parse(this.path, this.context)
      }
    },
    dataset() {
      return {
        label: this.label,
        borderColor: this.color,
        backgroundColor: this.color,
        data: this.seriesData,
        fill: false,
        borderWidth: this.width,
        pointRadius: this.marker == 'none' ? 0 : this.markerSize,
        pointStyle: this.marker,
        showLine: this.line,
        interpolate: this.line,
        steppedLine: this.stepped,
        noThresh: this.nothresh,
        order: this.order
      }
    },

    reloadTrigger() {
      // props that trigger a dataset reload when mutated
      return {
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
      this.$parent.$emit('update', this._uid, this.dataset, 'trend')
    },
    reloadTrigger() {
      this.requestLoad()
    },
    '$parent.chartStart'() {
      this.requestLoad()
    },
    '$parent.chartEnd'() {
      this.requestLoad()
    }
  },
  created() {
    this.requestLoad = _.debounce(function() {
      this.loadData()
    }, 10)
  },
  mounted () {
    this.$parent.$emit('update', this._uid, this.dataset, 'trend')
    // wait a tick to load data to get the rest of the chart to initialize
    this.$nextTick(function() {
      this.requestLoad()
    }.bind(this))
  },
  beforeDestroy () {
    this.$parent.$emit('delete', this._uid, this.dataset, 'trend')
  },
  methods: {
    async loadData() {

      this.$parent.$emit('loading', this._uid, 'trend')

      if(this.data !== null) {
        if(Promise.resolve(this.data) == this.data) {
          this.seriesData = await this.data
        } else {
          this.seriesData = this.data
        }
      }


      // use a request token to check if we need to cancel this method as Promises cannot really be cancelled (yet)
      var requestToken = Math.random()
      this.$options.requestToken = requestToken


      var path = this.pipath

      if (this.interpolated) {
        var response = await this.$pi.getInterpolated(path, this.$parent.chartStart, this.$parent.chartEnd, '300s')
      } else if (this.summary) {
        var response = await this.$pi.getSummary(path, this.$parent.chartStart, this.$parent.chartEnd, this.summaryInterval, 'Total')
      } else if (this.recorded) {
        var response = await this.$pi.getRecorded(path, this.$parent.chartStart, this.$parent.chartEnd)
      } else {
        var response = await this.$pi.getPlot(path, this.$parent.chartStart, this.$parent.chartEnd, 250)
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
          val = val.Value * 24
          ts = response[i].Value.Timestamp
        }

        seriesData.push({
          x: new Date(ts),
          y: val
        })
      }

      this.seriesData = seriesData
      this.$parent.$emit('finish', this._uid, 'trend')
    }
  }
}
</script>
<style>
</style>

