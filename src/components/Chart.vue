<template>
  <div class='pi-chart' @dblclick="isFullscreen = !isFullscreen" :class="{fullscreen: isFullscreen, loading: loading}" ref="container">

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
      <canvas :id='uid' ref='canvas'></canvas>
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
// import 'chartjs-plugin-mobilezoom'

export default {
  data () {
    return {
      mounted: false,
      components: { series: {}, thresholds: {}, axis: {}},
      zoomed: false,
      chart: null,
      isFullscreen: false,
      loadingIds: [],
      loading: false,
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
      type: [String, Number, Object],
      default: '*-24h'
    },
    end: {
      type: [String, Number, Object],
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
    },
    stacked: {
      type: Boolean,
      default: false
    },
    fontColor: {
      type: String,
      default: '#333'
    },
    grid: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    updating () {
      return this.loadingIds.length > 0
    }
  },

  created () {
    this.$on('update', this.updateData)
    this.$on('delete', this.deleteData)
    this.$on('loading', function (uid) {
      this.loadingIds.push(uid)
    }.bind(this))
    this.$on('finish', function (uid) {
      this.loadingIds = this.loadingIds.filter(function (value) { return value != uid })
    }.bind(this))

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
    }, 300)

    this.requestMobileLoad = _.debounce(function () {

    }, 1000)
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
      this.$options.chart.options.scales.xAxes[0].ticks.min = this.$pi.parseTime(val)
      this.$options.chart.update()
      this.requestLoad()
    },
    end (val) {
      this.$options.chart.options.scales.xAxes[0].ticks.max = this.$pi.parseTime(val)
      this.$options.chart.update()
      this.requestLoad()
    },
    title (val) {
      this.$options.chart.options.title = {
        display: this.title !== '',
        text: this.title
      }
      this.$options.chart.update()
    },
    min (val) {
      this.$options.chart.options.scales.yAxes[0].ticks.min = val
      this.$options.chart.update()
    },
    max (val) {
      this.$options.chart.options.scales.yAxes[0].ticks.max = val
      this.$options.chart.update()
    },
    legend(val) {
      this.$options.chart.options.legend.display = val !== 'none'
      this.$options.chart.options.legend.position = val
      this.$options.chart.update()
    },
    components: {
      handler: function (newVal) {
        // this.requestLoad()
        this.loadData()
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
      //plugins: [legendPlugin],

      options: {
        layout: {
          padding: 0
        },
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
                this.$emit('zoom', {start:start, end:end})
              }.bind(this)
            }
          }
        },
        events: ['mousemove', 'mouseout', 'mouseup'],
        responsive: this.responsive,
        maintainAspectRatio: this.maintainAspectRatio,
        showLines: true,
        tooltips: {
          enabled: false,
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
        },
        scales: {
          xAxes: [{
            stacked: this.stacked,
            type: 'time',
            gridLines: {
              display: this.grid
            },
            time: {
              displayFormats: {
                hour: 'HH:mm',
                minute: 'HH:mm'
              },
              tooltipFormat: 'dd. D MMM HH:mm:ss'
            },
            ticks: {
              major: {
                enabled: true,
                fontStyle: 'bold'
              },
              fontColor: this.fontColor,
              autoSkip: true,
              autoSkipPadding: 15,
              maxRotation: 0,
            }
          }],
          yAxes: []
        },
        trace: {
        },
        threshold: []
      }
    }

    if (this.type != 'scatter') {
      options.options.plugins.crosshair = false
    }

    // check for mobile
    if (/Mobi/.test(navigator.userAgent) == false) {
      options.options.plugins.mobilezoom = false
    } else {
      options.options.plugins.crosshair = false
    }

    var ctx = this.$refs.canvas
    this.$options.chart = new Chart(ctx, options)
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

    updateData (uid, data, type) {
      if (type == 'trend') {
        this.$set(this.components.series, String(uid), data)
      } else if (type == 'threshold') {
        this.$set(this.components.thresholds, String(uid), data)
      } else {
        this.$set(this.components.axis, String(uid), data)
        this.loadData()
      }
    },

    deleteData (uid, data, type) {
      if (type === 'trend') {
        this.$delete(this.components.series, String(uid))
      } else if (type == 'threshold') {
        this.$delete(this.components.thresholds, String(uid))
      } else {
        this.$delete(this.components.axis, String(uid))
      }
    },

    async loadData () {
      if (!this.$options.chart) {
        return
      }

      this.loading = true

      this.$options.chart.stop()

      // set scale
      this.$options.chart.options.scales.xAxes[0].ticks.min = this.$pi.parseTime(this.chartStart)
      this.$options.chart.options.scales.xAxes[0].ticks.max = this.$pi.parseTime(this.chartEnd)

      // set title
      this.$options.chart.options.title.display = this.title !== ''
      this.$options.chart.options.title.text = this.title

      if (Object.keys(this.components.axis) > 0) {
        this.$options.chart.options.scales.yAxes = []
      }

      // load axis
      for (var axisId in this.components.axis) {
        var axis = Object.assign({}, this.components.axis[axisId])
        axis.type = 'linear'
        this.$options.chart.options.scales.yAxes.push(axis)
        // hide default axis
      }

      // load thresholds
      this.$options.chart.options.threshold = []

      for (var thresholdId in this.components.thresholds) {
        // copy threshold to non-watched object
        var threshold = JSON.parse(JSON.stringify(this.components.thresholds[thresholdId]))
        if (threshold.value > -9999 && threshold.value !== null) {
          this.$options.chart.options.threshold.push(threshold)
          if (threshold.setMax) {
            var yscale = this.$options.chart.options.scales.yAxes[0]

            if (threshold.value > 1e6) {
              var scalemax = Math.round(threshold.value / 1e6) * 1e6 + 5e5
            } else {
              var scalemax = Math.round(threshold.value / 1e5) * 1e5 + 5e4
            }

            yscale.ticks.suggestedMax = scalemax
            //yscale.ticks.max = scalemax
          }
        }
      }

      // load datasets
      this.$options.chart.data.datasets = []

      for (var seriesId in this.components.series) {
        var series = Object.assign({}, this.components.series[seriesId])
        this.$options.chart.data.datasets.push(series)
      }

      this.$options.chart.data.datasets.sort((a, b) => a.order - b.order)


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

/* Crosshair styles  */
.chartjs-crosshair {
	position: absolute;
	top: 0px;
	bottom: 0px;
	border-left: 1px solid red;
	pointer-events: none;
}
.chartjs-tracepoint {
	position: absolute;
	width: 4px;
	height: 4px;
	margin-left: -4px;
	margin-top: -4px;
	background-color: white;
	border: 2px solid black;
	border-radius: 6px;
	z-index: 10;
	pointer-events: none;
}
.chartjs-fasttooltip {
	position: absolute;
	background: rgba(0,0,0,0.8);
	z-index: 11;
	padding: 5px;
	color: white;
	font-size: 12px;
	pointer-events: none;
	min-width: 140px;
}
.chartjs-zoombox {
	position: absolute;
	background:rgba(66,133,244,0.2);
	border: 1px solid #48F;
	pointer-events: none;
}
.chartjs-fasttooltip .tooltip-title {
	font-weight: bold;
	display: block;
}
.chartjs-fasttooltip .tooltip-result {
	display: block;
}
.chartjs-fasttooltip .tooltip-result-box {
	display: inline-block;
	width: 10px;
	height: 10px;
	margin-right: 5px;
}
</style>
