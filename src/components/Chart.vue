<template>
  <div class='pi-chart' @dblclick="isFullscreen = !isFullscreen" :class="{fullscreen: isFullscreen}">
    <transition name='fade'>
      <div class='pi-loading' v-show='loading'></div>
    </transition>
      <canvas :id='uid'></canvas>
    <!-- fake slot -->
    <slot></slot>
  </div>
</template>
<script>

import Chart from 'chart.js'
// import Hammer from 'hammerjs'

import moment from 'moment'
import _ from 'lodash'

import 'chartjs-plugin-interpolate'
import 'chartjs-plugin-trace'
import 'chartjs-plugin-threshold'
import 'chartjs-plugin-export'

export default {
  data () {
    return {
      mounted: false,
      components: { series: {}, thresholds: {}},
      zoomed: false,
      chart: null,
      isFullscreen: false,
      loading: true,
      chartStart: '',
      chartEnd: '',
      uid: ''
    }
  },
  props: {
    start: {
      type: String,
      default: '*-24h'
    },
    end: {
      type: String,
      default: '*'
    },
    responsive: {
      type: Boolean,
      default: true
    },
    maintainAspectRatio: {
      type: Boolean,
      default: true
    },
    tooltips: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      default: ''
    },
    min: {
      type: Number,
      default: null
    },
    max: {
      type: Number,
      default: null
    },
    suggestedMin: {
      type: Number,
      default: null
    },
    suggestedMax: {
      type: Number,
      default: null
    },
    legend: {
      type: String,
      default: 'none'
    }
  },

  created () {
    this.$on('update', this.updateData)
    this.$on('delete', this.deleteData)
    // set request load debounce function

    this.requestLoad = _.debounce(function () {
      this.chartStart = this.start
      this.chartEnd = this.end
      this.loading = true
      if (this.$options.chart) {
        if (this.$options.chart.tracer) {
          this.$options.chart.tracer.reset()
        }
        this.loadData()
      }
    }, 50)
  },
  watch: {
    start (val) {
      this.requestLoad()
    },
    end (val) {
      this.requestLoad()
    },
    components: {
      handler: function () { this.requestLoad() },
      deep: true
    }
  },
  mounted () {
    this.uid = Math.random().toString(32).substring(2)
    this.chartStart = this.start
    this.chartEnd = this.end

    var options = {
      type: 'line',
      options: {
        animation: false,
        title: {
          display: this.title != '',
          text: this.title
        },
        events: ['mousemove', 'mouseout', 'mouseup'],
        responsive: this.responsive,
        maintainAspectRatio: this.maintainAspectRatio,
        showLines: true,
        tooltips: {
          enabled: this.tooltips,
          intersect: false,
          mode: 'interpolate',
          position: 'average'
        },
        elements: {
          line: {
            tension: 0.1
          }
        },
        legend: {
          display: this.legend != 'none',
          position: this.legend
        },
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              displayFormats: {
                hour: 'HH:mm',
                minute: 'HH:mm'
              },
              tooltipFormat: 'dd. D MMM HH:mm:ss'
            }
          }],
          yAxes: [{
            type: 'linear',
            position: 'left',
            ticks: {}
          }]
        },
        trace: {
          beforeZoom (start, end) {
            return true
          },
          afterZoom: function (start, end) {
            this.chartStart = start
            this.chartEnd = end
            this.loadData(false)
          }.bind(this)
        },
        threshold: []
      }
    }

    if (this.min != null) { options.options.scales.yAxes[0].ticks.min = this.min }
    if (this.max != null) { options.options.scales.yAxes[0].ticks.max = this.max }
    if (this.suggestedMin != null) { options.options.scales.yAxes[0].ticks.suggestedMin = this.suggestedMin }
    if (this.suggestedMax != null) { options.options.scales.yAxes[0].ticks.suggestedMax = this.suggestedMax }

    this.$nextTick(function () {
      var ctx = document.getElementById(this.uid)
      this.$options.chart = new Chart(ctx, options)
      console.log('requesting load')
      this.requestLoad()
    })
  },
  beforeDestroy () {
    // cleanup chart
    this.$options.chart.destroy()
  },

  methods: {
    fullscreen (evt) {
      evt.preventDefault()
    },
    requestLoad () {},
    updateData (uid, data) {
      if (data.type == 'trend') {
        this.$set(this.components.series, String(uid), data)
      } else {
        this.$set(this.components.thresholds, String(uid), data)
      }
    },
    deleteData (uid, data) {
      if (data.type == 'trend') {
        this.$delete(this.components.series, String(uid))
      } else {
        this.$set(this.components.thresholds, String(uid), data)
      }
    },

    async loadData (reset = true) {
      if (!this.$options.chart) {
        return
      }

      this.$options.chart.stop()

      if (reset) {
        this.$options.chart.data.datasets = []
        this.$options.chart.options.threshold = []
        this.$options.chart.update()
      }

      // set scale
      this.$options.chart.options.scales.xAxes[0].time.min = this.$pi.parseTime(this.chartStart)
      this.$options.chart.options.scales.xAxes[0].time.max = this.$pi.parseTime(this.chartEnd)

      // load thresholds
      for (var thresholdId in this.components.thresholds) {
        this.$options.chart.options.threshold.push(this.components.thresholds[thresholdId])
      }

      var data = []
      // use a request token to check if we need to cancel this method as Promises cannot really be cancelled (yet)
      var requestToken = Math.random()
      this.$options.requestToken = requestToken

      var requests = []
      for (var objectId in this.components.series) {
        const series = this.components.series[objectId]
        const path = this.components.series[objectId].path
        if (this.components.series[objectId].recorded) {
          requests.push(this.$pi.getRecorded(path, this.chartStart, this.chartEnd))
        } else {
          requests.push(this.$pi.getPlot(path, this.chartStart, this.chartEnd, 150))
        }
      }

      var responses = await Promise.all(requests)
      // check local requestToken with global requesttoken, if mismatch, cancel request
      if (requestToken != this.$options.requestToken) {
        return
      }

      for (var objectId in this.components.series) {
        const series = this.components.series[objectId]

        const seriesData = []

        const path = this.components.series[objectId].path

        const response = responses.shift()

        if (!response) {
          continue
        }

        for (var i = 0; i < response.length; i++) {
          const val = response[i].Value
          seriesData.push({
            x: new Date(response[i].Timestamp),
            y: val
          })
        }

        var newDataset = {
          label: series.label,
          borderColor: series.color,
          backgroundColor: series.color,
          data: seriesData,
          borderWidth: series.width,
          pointRadius: series.markersize,
          pointStyle: series.marker,
          fill: false,
          objectId: objectId,
          showLine: series.line,
          interpolate: series.line,
          steppedLine: series.stepped
        }

        if (!reset) {
          for (var index in this.$options.chart.data.datasets) {
            var dataset = this.$options.chart.data.datasets[index]
            if (dataset.objectId == objectId) {
              this.$options.chart.data.datasets[index] = newDataset
            }
          }
        } else {
          this.$options.chart.data.datasets.push(newDataset)
        }
      }
      this.loading = false

      this.$options.chart.update()
    }
  }

}
</script>
<style>
.pi-chart {
  background: #FFF;
  border: 1px solid #AAA;
  position: relative;
}
.pi-chart .reset-zoom {
  position: absolute;
  right: 20px;
  top: 20px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.pi-chart .pi-loading {
  background-color: rgba(255,255,255,0.9);
  position: absolute;
  left: 0px;
  right: 0px;
  top: 0px;
  bottom: 0px;
}
</style>
