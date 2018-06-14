<template>
  <div class='pi-chart'>
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

import moment from 'moment'
import _ from 'lodash'

import 'chartjs-plugin-interpolate'
import 'chartjs-plugin-trace'
import 'chartjs-plugin-threshold'

export default {
  data() { return {
    mounted: false,
    series: {},
    zoomed: false,
    chart: null,
    loading: true,
    chartStart: "",
    chartEnd: "",
    uid: "",
  }},
  props: {
    start: {
      type: String,
      default: "*-24h"
    },
    end: {
      type: String,
      default: "*"
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


  created() {
    this.$on('update', this.updateData)
    this.$on('delete', this.deleteData)
    // set request load debounce function

    this.requestLoad = _.debounce(function() {
      this.chartStart = this.start
      this.chartEnd = this.end
      this.loading = true
      if(this.$options.chart.tracer) {
        this.$options.chart.tracer.reset()
      }
      this.loadData()
    }, 10)

  },
  watch: {
    start(val) {
      this.requestLoad()
    },
    end(val) {
      this.requestLoad()
    },
    series: {
      handler: function() { this.requestLoad() },
      deep: true
    },
  },
  mounted() {
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
         position: this.legend,
       },
       scales: {
         xAxes: [{
           type: 'time'
         }],
         yAxes: [{
           type: 'linear',
           position: 'left',
           ticks: {}
         }]
       },
       trace: {
         beforeZoom(start, end) {
           return true
         },
         afterZoom: function(start, end) {
           this.chartStart = start
           this.chartEnd = end
           this.loadData(false)
         }.bind(this)
       }
      }
    }
    if(this.min != null) { options.options.scales.yAxes[0].ticks.min = this.min }
    if(this.max != null) { options.options.scales.yAxes[0].ticks.max = this.max }
    if(this.suggestedMin != null) { options.options.scales.yAxes[0].ticks.suggestedMin = this.suggestedMin }
    if(this.suggestedMax != null) { options.options.scales.yAxes[0].ticks.suggestedMax = this.suggestedMax }

    this.$nextTick(function() {
      var ctx = document.getElementById(this.uid)
      this.$options.chart = new Chart(ctx, options)
    })
  },
  beforeDestroy() {
    // cleanup chart
    console.log(this.$options.chart.id)
    this.$options.chart.destroy()
  },

  methods: {
    requestLoad() {},
    updateData(uid, data) {
      this.$set(this.series,uid,data)
    },
    deleteData(uid, data) {
      this.$delete(this.series, uid)
    },

    async loadData(reset = true) {

      this.$options.chart.stop()

      if(reset) {
        this.$options.chart.data.datasets = []
        this.$options.chart.update()
      }

      var data = []
      // use a request token to check if we need to cancel this method as Promises cannot really be cancelled (yet)
      var requestToken = Math.random()
      this.$options.requestToken = requestToken

      var requests = []
      for(var objectId in this.series) {
        let series = this.series[objectId]
        let path = this.series[objectId].path
        if(this.series[objectId].recorded) {
          requests.push(this.$pi.getRecorded(path, this.chartStart, this.chartEnd))
        } else {
          requests.push(this.$pi.getPlot(path, this.chartStart, this.chartEnd, 150))
        }
      }

      var responses = await Promise.all(requests)
      // check local requestToken with global requesttoken, if mismatch, cancel request
      if(requestToken != this.$options.requestToken) {
        return
      }

      for(var objectId in this.series) {

        let series = this.series[objectId]

        let seriesData = []

        let path = this.series[objectId].path

        let response = responses.shift()

        if(!response) {
          continue
        }

        for(var i=0;i < response.length; i++) {
          const val = response[i].Value
          seriesData.push({
            x: new Date(response[i].Timestamp),
            y: val,
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
          interpolate: series.line
        }

        if(!reset) {
          for(var index in this.$options.chart.data.datasets) {
            var dataset = this.$options.chart.data.datasets[index]
            if(dataset.objectId == objectId) {
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
  },

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
