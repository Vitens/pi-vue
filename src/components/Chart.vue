<template>
  <div class='pi-chart' @dblclick="isFullscreen = !isFullscreen" :class="{fullscreen: isFullscreen}" ref="container">

    <div class='pi-updating' v-show='updating'></div>

    <el-popover
      
      placement="left"
      popper-class='pi-chart-popper'
      >
      <div class='pi-chart-axis-controls'>
        <label>maximum</label>
        <el-input-number size='small' controls-position='right' placeholder='auto' v-model='userMax' :step='userStep'></el-input-number>
        <label>minimum</label>
        <el-input-number size='small' controls-position='right' placeholder='auto' v-model='userMin' :step='userStep'></el-input-number>
      </div>

      <div slot='reference' class='pi-chart-axis-area' @click='controlsVisible = !controlsVisible'>
      </div>
    </el-popover>
    
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

import _ from 'lodash'

// import 'chartjs-plugin-export'
import 'chartjs-plugin-crosshair'
import 'chartjs-plugin-threshold'
import 'chartjs-plugin-mobilezoom'

const legendPlugin = {
  id: 'legendPlugin',
  afterEvent: function (chart, e) {
    if (chart.legendHovered) {
      var meta = chart.getDatasetMeta(0)
      var yScale = chart.scales[meta.yAxisID]
      if (e.y > yScale.getPixelForValue(yScale.max)) {
        chart.legendHovered = false
        chart.lasthovered = -1
        for (var index = 0; index < chart.config.data.datasets.length; index++) {
          chart.config.data.datasets[index].backgroundColor = chart.config.data.datasets[index].originalColor
        }
        chart.update()
      }
    }
  },
  beforeTooltipDraw: function (chart) {
    return !chart.legendHovered
  }
}

export default {
  data () {
    return {
      mounted: false,
      components: { series: {}, thresholds: {}, axis: {}},
      zoomed: false,
      chart: null,
      isFullscreen: false,
      loading: true,
      updating: false,
      chartStart: '',
      chartEnd: '',
      uid: '',
      controlsVisible: false,
      userMin: 0,
      userMax: 0,
      userStep: 0.1
    }
  },
  props: {
    start: {
      type: [String, Number],
      default: '*-24h'
    },
    end: {
      type: [String, Number],
      default: '*'
    },
    responsive: {
      type: Boolean,
      default: true
    },
    maintainAspectRatio: {
      type: Boolean,
      default: !/Mobi/.test(navigator.userAgent)
    },
    tooltips: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      default: ''
    },
    yLabel: {
      type: String,
      default: ''
    },
    legend: {
      type: String,
      default: 'none'
    },
    type: {
      type: String,
      default: 'scatter'
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
    }, 1000)

    this.requestMobileLoad = _.debounce(function () {
      this.loadData(false)
    }.bind(this), 1000)
  },
  watch: {
    controlsVisible (val) {
      var yscale = this.$options.chart.scales[this.$options.chart.getDatasetMeta(0).yAxisID]

      this.userMin = yscale.min
      this.userMax = yscale.max
      var diff = this.userMax - this.userMin
      if (diff > 10) {
        this.userStep = 1
      }
      if (diff < 0.4) {
        this.userStep = 0.01
      }
    },
    userMin (val) {
      this.$options.chart.options.scales.yAxes[this.$options.chart.options.scales.yAxes.length - 1].ticks.min = val
      this.$options.chart.update()
    },
    userMax (val) {
      this.$options.chart.options.scales.yAxes[this.$options.chart.options.scales.yAxes.length - 1].ticks.max = val
      this.$options.chart.update()
    },
    start (val) {
      this.requestLoad()
    },
    end (val) {
      this.requestLoad()
    },
    min (val) {
      this.$options.chart.options.scales.yAxes[0].ticks.min = val
      this.$options.chart.update()
    },
    max (val) {
      this.$options.chart.options.scales.yAxes[0].ticks.max = val
      this.$options.chart.update()
    },
    components: {
      handler: function (newVal) {
        this.requestLoad()
      },
      deep: true
    }
  },
  mounted () {
    this.uid = Math.random().toString(32).substring(2)
    this.chartStart = this.start
    this.chartEnd = this.end

    var options = {
      type: this.type,
      plugins: [legendPlugin],

      options: {
        animation: false,
        title: {
          display: this.title !== '',
          text: this.title
        },
        plugins: {
          mobilezoom: {
            callbacks: {
              afterZoomPan: function (start, end) {
                this.chartStart = start
                this.chartEnd = end
                this.requestMobileLoad()
                // this.loadData(false)
              }.bind(this),
              doubleTap: function () {
                this.toggleMobileFullScreen()
              }.bind(this)
            }
          },

          crosshair: {
            sync: {
              suppressTooltips: true
            },
            zoom: {
              zoomButtonClass: 'reset-zoom el-button el-button--small'
            },
            callbacks: {
              beforeZoom (start, end) {
                return true
              },
              afterZoom: function (start, end) {
                this.chartStart = start
                this.chartEnd = end
                this.loadData(false)
              }.bind(this)
            }
          }
        },
        events: ['mousemove', 'mouseout', 'mouseup'],
        responsive: this.responsive,
        maintainAspectRatio: this.maintainAspectRatio,
        showLines: true,
        tooltips: {
          enabled: this.tooltips,
          intersect: false,
          mode: (this.type == 'scatter') ? 'interpolate' : 'index',
          position: 'average',
          callbacks: {
            title: function (a, d) {
              if (typeof a[0].xLabel !== 'string') {
                return a[0].xLabel.format('dd D MMM YYYY HH:mm')
              } else {
                return a[0].xLabel
              }
            },
            label: function (i, d) {
              return d.datasets[i.datasetIndex].label + ': ' + i.yLabel.toFixed(2)
            }
          }
        },
        elements: {
          line: {
            tension: 0.1
          }
        },
        legend: {
          display: this.legend !== 'none',
          position: this.legend,
          onHover: function (event, legendItem) {
            var ci = this.chart
            var hoveredDatasetIndex = legendItem.datasetIndex
            if (ci.lasthovered === hoveredDatasetIndex) {
              return
            }

            ci.lasthovered = hoveredDatasetIndex
            for (var index = 0; index < ci.config.data.datasets.length; index++) {
              if (!ci.config.data.datasets[index].originalColor) {
                ci.config.data.datasets[index].originalColor = ci.config.data.datasets[index].backgroundColor
              }
              ci.config.data.datasets[index].backgroundColor = 'rgba(0,0,0,0.025)'
            }
            ci.config.data.datasets[hoveredDatasetIndex].backgroundColor = ci.config.data.datasets[hoveredDatasetIndex].originalColor
            ci.legendHovered = true
            ci.update()
          }
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
          yAxes: []
        },
        trace: {
        },
        threshold: []
      }
    }

    if (this.type == 'bar') {
      options.options.plugins.crosshair = false
    }

    // check for mobile
    if (/Mobi/.test(navigator.userAgent) == false) {
      options.options.plugins.mobilezoom = false
    } else {
      options.options.plugins.crosshair = false
    }

    this.$nextTick(function () {
      var ctx = document.getElementById(this.uid)
      this.$options.chart = new Chart(ctx, options)
      // this.requestLoad()
    })
  },
  beforeDestroy () {
    // cleanup chart
    this.$options.chart.destroy()
  },

  methods: {
    toggleMobileFullScreen () {
      if (this.isFullscreen) {
        this.$refs.container.style.height = this.$options.height + 'px'
      } else {
        this.$options.height = this.$refs.container.clientHeight
        this.$refs.container.style.height = null
      }
      this.isFullscreen = !this.isFullscreen
    },

    fullscreen (evt) {
      evt.preventDefault()
    },

    requestLoad () {},

    updateData (uid, data) {
      if (data.type == 'trend') {
        this.$set(this.components.series, String(uid), data)
      } else if (data.type == 'threshold') {
        this.$set(this.components.thresholds, String(uid), data)
      } else {
        this.$set(this.components.axis, String(uid), data)
      }
    },

    deleteData (uid, data) {
      if (data.type === 'trend') {
        this.$delete(this.components.series, String(uid))
      } else if (data.type == 'theshold') {
        this.$delete(this.components.thresholds, String(uid))
      } else {
        this.$delete(this.components.axis, String(uid))
      }
    },

    async loadData (reset = true) {
      console.log('trigger')
      if (!this.$options.chart) {
        return
      }
      if (!this.loading) {
        this.updating = true
      }

      this.$options.chart.stop()

      if (reset) {
        this.$options.chart.data.datasets = []
        this.$options.chart.options.threshold = []
        this.$options.chart.options.scales.yAxes = []
        this.$options.chart.update()
      }

      // set scale
      this.$options.chart.options.scales.xAxes[0].time.min = this.$pi.parseTime(this.chartStart)
      this.$options.chart.options.scales.xAxes[0].time.max = this.$pi.parseTime(this.chartEnd)

      // set title
      this.$options.chart.options.title.display = this.title !== ''
      this.$options.chart.options.title.text = this.title

      // load thresholds
      for (var thresholdId in this.components.thresholds) {
        // copy threshold to non-watched object
        var threshold = JSON.parse(JSON.stringify(this.components.thresholds[thresholdId]))
        var value = threshold.value
        if (value == null) {
          value = await this.$pi.getValue(this.$pi.parse(threshold.path, threshold.context))
          threshold.value = value.Value
        }
        if (threshold.value > -9999) {
          this.$options.chart.options.threshold.push(threshold)
        }
      }

      // load axis
      for (var axisId in this.components.axis) {
        var axis = Object.assign({}, this.components.axis[axisId])
        axis.type = 'linear'
        this.$options.chart.options.scales.yAxes.push(axis)
        // hide default axis
        this.$options.chart.options.scales.yAxes[0].display = false
      }

      // use a request token to check if we need to cancel this method as Promises cannot really be cancelled (yet)

      var requestToken = Math.random()
      this.$options.requestToken = requestToken

      var requests = []
      for (var objectId in this.components.series) {
        const path = this.components.series[objectId].path
        if (this.components.series[objectId].interpolated) {
          requests.push(this.$pi.getInterpolated(path, this.chartStart, this.chartEnd, '300s'))
        } else if (this.components.series[objectId].summary) {
          requests.push(this.$pi.getSummary(path, this.chartStart, this.chartEnd, this.components.series[objectId].summary_interval, 'Total'))
        } else if (this.components.series[objectId].recorded) {
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
          steppedLine: series.stepped,
          yAxisID: series.yAxisID
        }

        if (!reset) {
          for (var index in this.$options.chart.data.datasets) {
            var dataset = this.$options.chart.data.datasets[index]
            if (dataset.objectId === objectId) {
              this.$options.chart.data.datasets[index] = newDataset
            }
          }
        } else {
          this.$options.chart.data.datasets.push(newDataset)
        }
      }

      this.loading = false
      this.updating = false

      this.$options.chart.update(0)
    }
  }

}
</script>
<style>
.pi-chart {
  background: #FFF;
  border: 1px solid #AAA;
  position: relative;
  touch-action: pan-x pinch-zoom;
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

.pi-chart .chart-options {
  position: absolute;
  right: 2px;
  top: 2px;
  border: none;
  background: transparent;
  padding: 2px 5px;
  margin: 0px;
  cursor: pointer;
}
.pi-chart .chart-options div {
  width: 12px;
  height: 2px;
  background: #999;
  margin: 2px 0px;
}

.pi-chart .chart-options:hover div {
  background: #000;
}

.pi-chart .chart-options-menu {
  position: absolute;
  top: 22px;
  right: 5px;
  background: white;
  border: 1px solid #999;
  box-shadow: 2px 2px 4px #AAA;
  padding: 0px;
  margin: 0px;
  min-width: 150px;
  display: none;
}
.pi-chart .chart-options-menu.visible {
  display: block;
}
.pi-chart .chart-options-menu li {
  font-size: 13px;
  list-style-type: none;
  margin: 5px 0px;
  color: #333;
}

.pi-chart .chart-options-menu li:hover {
  background: #409EFE;
}

.pi-chart .chart-options-menu li a {
  width: 100%;
  display: inline-block;
  padding: 5px 10px;
  color: #333;
  text-decoration: none;
  cursor: pointer;
}
.pi-chart .chart-options-menu li a:hover {
  color: white;
}
.pi-chart.fullscreen {
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;

  position: fixed !important;
  z-index: 100000;
}

.pi-chart-axis-area {
  position: absolute;
  left: 0px;
  top: 0px;
  bottom: 0px;
  width: 35px;
  cursor: pointer;
  background: rgba(255,0,0,0.0);
}
.pi-chart-axis-area:focus {
  outline: none;
}
.pi-chart-popper {
  z-index: 100001 !important;
}
.pi-chart-axis-controls label {
  display: block;
  margin-top: 5px;
  font-weight: bold;
}
.pi-chart .pi-updating {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 16px;
  height: 16px;
  background: url(data:image/gif;base64,R0lGODlhEAAQAPQAAP///1hYWPr6+nx8fK6urltbW3BwcOPj48XFxWZmZqWlpZqamu3t7bu7u9nZ2YeHh5CQkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAAFUCAgjmRpnqUwFGwhKoRgqq2YFMaRGjWA8AbZiIBbjQQ8AmmFUJEQhQGJhaKOrCksgEla+KIkYvC6SJKQOISoNSYdeIk1ayA8ExTyeR3F749CACH5BAkKAAAALAAAAAAQABAAAAVoICCKR9KMaCoaxeCoqEAkRX3AwMHWxQIIjJSAZWgUEgzBwCBAEQpMwIDwY1FHgwJCtOW2UDWYIDyqNVVkUbYr6CK+o2eUMKgWrqKhj0FrEM8jQQALPFA3MAc8CQSAMA5ZBjgqDQmHIyEAIfkECQoAAAAsAAAAABAAEAAABWAgII4j85Ao2hRIKgrEUBQJLaSHMe8zgQo6Q8sxS7RIhILhBkgumCTZsXkACBC+0cwF2GoLLoFXREDcDlkAojBICRaFLDCOQtQKjmsQSubtDFU/NXcDBHwkaw1cKQ8MiyEAIfkECQoAAAAsAAAAABAAEAAABVIgII5kaZ6AIJQCMRTFQKiDQx4GrBfGa4uCnAEhQuRgPwCBtwK+kCNFgjh6QlFYgGO7baJ2CxIioSDpwqNggWCGDVVGphly3BkOpXDrKfNm/4AhACH5BAkKAAAALAAAAAAQABAAAAVgICCOZGmeqEAMRTEQwskYbV0Yx7kYSIzQhtgoBxCKBDQCIOcoLBimRiFhSABYU5gIgW01pLUBYkRItAYAqrlhYiwKjiWAcDMWY8QjsCf4DewiBzQ2N1AmKlgvgCiMjSQhACH5BAkKAAAALAAAAAAQABAAAAVfICCOZGmeqEgUxUAIpkA0AMKyxkEiSZEIsJqhYAg+boUFSTAkiBiNHks3sg1ILAfBiS10gyqCg0UaFBCkwy3RYKiIYMAC+RAxiQgYsJdAjw5DN2gILzEEZgVcKYuMJiEAOwAAAAAAAAAAAA==);
}
</style>
