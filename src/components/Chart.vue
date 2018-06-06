<template>
  <div class='chart' v-loading='loading'>
      <canvas :id='uid'></canvas>
    <!-- fake slot -->
    <slot></slot>
  </div>
</template>
<script>

import Chart from 'chart.js'

import moment from 'moment'
import _ from 'lodash'

require('../chart.trace.js')
require('../chart.interpolate.js')

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
      this.loading = true
      this.loadData()
    }, 10)

  },
  watch: {
    series: {
      handler: function() { this.requestLoad() },
      deep: true
    }
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
    if(this.min != null) { options.options.scales.yAxes[0].ticks.suggestedMin = this.min }
    if(this.max != null) { options.options.scales.yAxes[0].ticks.suggestedMax = this.max }

    this.$nextTick(function() {
      var ctx = document.getElementById(this.uid)
      this.$options.chart = new Chart(ctx, options)
    })
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

      for(var objectId in this.series) {

        let series = this.series[objectId]

        let seriesData = []

        let path = this.series[objectId].path

        let response = await this.$pi.getPlot(path, this.chartStart, this.chartEnd, 150)
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
          interpolate: series.line,
          steppedLine: series.stepped
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
.chart {
  background: #FFF;
  border: 1px solid #AAA;
  position: relative;
}
.reset-zoom {
  position: absolute;
  right: 20px;
  top: 20px;
}
</style>

