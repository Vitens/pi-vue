<template>
  <div class='pi-chart' @dblclick="isFullscreen = !isFullscreen" :class="{fullscreen: isFullscreen, loading: loading}" ref="container">

    <div class='pi-chart-reset-zoom' v-show='showReset' @click='resetZoom'></div>
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

      <template #reference>
        <div class='pi-chart-axis-area' @click='controlsVisible = !controlsVisible'></div> 
      </template>
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
import { defineComponent } from 'vue';

import Chart from 'chart.js/auto'
import { getRelativePosition } from 'chart.js/helpers';
import 'chartjs-adapter-moment';

import _ from 'lodash';
import moment from 'moment';

// import 'chartjs-plugin-export'
import 'chartjs-plugin-crosshair'
import 'chartjs-plugin-threshold'
import 'chartjs-plugin-mobilezoom'

export default defineComponent({
  data () {
    return {
      mounted: false,
      components: { series: {}, thresholds: {}, axis: {}},
      zoomed: false,
      chart: null,
      isFullscreen: false,
      loadingIds: [],
      loading: true,
      chartStart: '',
      chartEnd: '',
      uid: '',
      controlsVisible: false,
      userMin: undefined,
      userMax: undefined,
      userStep: 0.1
    }
  },
  emits: ['zoom'],
  props: {
    start: {
      type: [String, Number, Object],
      default: '*-24h'
    },
    end: {
      type: [String, Number, Object],
      default: '*'
    },
    refresh: {
      type: Number,
      default: 0
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
    click: {
      type: Function,
      default(x) { return }
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
      default: 'auto'
    },
    grid: {
      type: Boolean,
      default: true
    },
    timeUnit: {
      type: String,
      default: '',
    }
  },
  computed: {
    updating () {
      return this.loadingIds.length > 0
    },
    showReset () {
      return (this.userMin !== undefined) || (this.userMin !== undefined)
    },

  },

  created () {
    // set request load debounce function
    this.chartStart = this.start
    this.chartEnd = this.end
    this.requestLoad = _.debounce(function () {
      if (this.$chart) {
        if (this.$chart.tracer) {
          this.$chart.tracer.reset()
        }
        this.loadData()
      }
    }, 300)

    this.requestMobileLoad = _.debounce(function () {
      this.loadData(false)
    }, 1000)

  },
  watch: {
    controlsVisible (val) {
      var yscale = this.$chart.scales[this.$chart.getDatasetMeta(0).yAxisID]

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
      var yscale = this.$chart.getDatasetMeta(0).yAxisID
      this.$chart.options.scales[yscale].min = val
      this.$chart.update()
    },
    userMax (val) {
      var yscale = this.$chart.getDatasetMeta(0).yAxisID
      this.$chart.options.scales[yscale].max = val
      this.$chart.update()
    },
    start (val) {
      this.$chart.options.scales.x.min = this.$pi.parseTime(val)
      this.$chart.update()
      this.chartStart = val
      this.requestLoad()
    },
    end (val) {
      this.$chart.options.scales.x.max = this.$pi.parseTime(val)
      this.chartEnd = val
      this.$chart.update()
      this.requestLoad()
    },
    title (val) {
      this.$chart.options.title = {
        display: this.title !== '',
        text: this.title
      }
      this.$chart.update()
    },
    min (val) {
      this.$chart.options.scales.y.min = val
      this.$chart.update()
    },
    max (val) {
      this.$chart.options.scales.y.max = val
      this.$chart.update()
    },
    legend (val) {
      this.$chart.options.plugin.legend.display = val !== 'none'
      this.$chart.options.plugin.legend.position = val
      this.$chart.update()
    },
    components: {
      handler: function (newVal) {
        // this.requestLoad()
        //this.loadData()
      },
      deep: true
    }
  },
  mounted () {
    this.uid = Math.random().toString(32).substring(2)
    this.chartStart = this.start
    this.chartEnd = this.end

    let html = document.querySelector('html')
    this.$options.observer = new MutationObserver(function() {
      console.log('toggle dark mode')
      this.$nextTick().then(() => {
        this.$chart.update()
      })
    }.bind(this))

    this.$options.observer.observe(html, {attributes: true, attributeFilter: ['class']})

    var options = {
      type: this.type,
      // plugins: [legendPlugin],

      options: {
        onClick: function(e) {
          if(this.type != 'bar') { return }
          const elem = this.$chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
          if(elem.length) {
            this.click(elem[0].element.$context.parsed.x)
          }
        }.bind(this),
        parsing: false,
        layout: {
          padding: {left: 5}
        },
        animation: false,
        plugins: {
          title: {
            display: this.title !== '',
            text: this.title,
            color: () => this.defaultfontColor()
          },
          legend: {
            display: this.legend !== 'none',
            position: this.legend,
            labels: {
              color: () => this.defaultfontColor(),
              filter: function (legendItem, data) {
                return legendItem.text != undefined
              }
            }
          },
          mobilezoom: {
            callbacks: {
              afterZoomPan: () => function (start, end) {
                this.chartStart = start
                this.chartEnd = end
                this.$chart.options.scales.x.min = this.$pi.parseTime(start)
                this.$chart.options.scales.x.max = this.$pi.parseTime(end)
                this.$chart.update()
              }.bind(this),
              doubleTap: () => function() {
                this.toggleMobileFullScreen()
              }.bind(this)
            }
          },
          tooltip: {
            enabled: false,
            intersect: false,
            mode: (this.type == 'scatter') ? 'interpolate' : 'index',
            position: 'average',
            callbacks: {
              title: function (d) {

                let x = d[0].element.parsed ? d[0].element.parsed.x : d[0].parsed.x

                if (typeof x !== 'string') {
                  return moment(x).format('dd D MMM YYYY HH:mm')
                } else {
                  return x
                }
              },
              label: function (d) {
                let y = d.element.parsed ? d.element.parsed.y : d.parsed.y
                return d.chart.data.datasets[d.datasetIndex].label + ": " + y.toFixed(2)
              }
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
              beforeZoom: () => function(start, end) {
                return true
              },
              afterZoom: () => function (start, end) {
                this.$emit('zoom', { start: moment(start), end: moment(end) })
              }.bind(this),
              afterVerticalZoom: () => function (start, end) {
                this.userMin = start
                this.userMax = end
              }.bind(this)
            }
          }
        },
        events: ['mousemove', 'mouseout', 'mouseup', 'click'],
        responsive: this.responsive,
        maintainAspectRatio: this.maintainAspectRatio,
        showLines: true,
        elements: {
          line: {
            tension: 0.1
          }
        },
        scales: {
          x: {
            stacked: this.stacked,
            type: 'time',
            grid: {
              display: this.grid,
              color: () => this.gridColor()
            },
            time: {
              displayFormats: {
                hour: 'HH:mm',
                minute: 'HH:mm'
              },
              tooltipFormat: 'dd. D MMM HH:mm:ss',
              unit: this.timeUnit
            },
            ticks: {
              major: {
                enabled: true,
              },
              font: function(context) {
                if(context.tick && context.tick.major) {
                  return {weight: 'bold'}
                }
              },
              color: function() { return this.fontColor != 'auto' ? this.fontColor : this.defaultfontColor() }.bind(this),
              autoSkip: true,
              autoSkipPadding: 15,
              maxRotation: 0
            }
          },
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
    this.$chart = new Chart(ctx, options)
    this.nuid = this.uid
    // set refresh
    if (this.refresh > 0) {
      this.interval = setInterval(this.doRefresh, this.refresh * 1000)
    }

  },
  beforeUnmount () {
    // cleanup chart
    this.$chart.destroy()
    // unset interval
    if (this.interval) {
      clearInterval(this.interval)
    }
  },

  methods: {
    doRefresh() {
      // only refresh if start or end is string and starts with *
      if (typeof this.start === 'string' && this.start.startsWith('*')) {
        this.requestLoad()
      }
    },
    defaultfontColor() {
      return document.querySelector('html').classList.contains('dark') ? '#EEE' : '#333'
    },
    gridColor() {
      return document.querySelector('html').classList.contains('dark') ? '#666' : '#EEE'
    },
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

    resetZoom () {
      this.userMin = undefined
      this.userMax = undefined
    },

    requestLoad () {},

    updateData (uid, data, type) {
      if (type == 'trend') {
        this.components.series[uid] = data
      } else if (type == 'threshold') {
        this.components.thresholds[uid] = data
      } else {
        this.components.axis[uid] = data
      }
      this.requestLoad()
    },
    setLoading(uid, type) {
      this.loadingIds.push(uid)
    },
    setFinished(uid) {
      this.loadingIds = this.loadingIds.filter(function (value) { return value != uid })
    },

    deleteData (uid, data, type) {
      if (type === 'trend') {
        delete this.components.series[uid]
      } else if (type == 'threshold') {
        delete this.components.thresholds[uid]
      } else {
        delete this.components.axis[uid]
      }
      console.log(this.components)
      this.requestLoad()
    },

    async loadData () {

      if (!this.$chart) {
        return
      }

      this.$chart.stop()

      // set scale
      this.$chart.options.scales.x.min = this.$pi.parseTime(this.chartStart)
      this.$chart.options.scales.x.max = this.$pi.parseTime(this.chartEnd)

      // set title
      this.$chart.options.plugins.title.display = this.title !== ''
      this.$chart.options.plugins.title.text = this.title

      // load datasets
      this.$chart.data.datasets = []


      var lowestY = 1e99
      var highestY = -1e99

      for (var seriesId in this.components.series) {
        var series = Object.assign({}, this.components.series[seriesId])
        this.$chart.data.datasets.push(series)

        const min = _.minBy(series.data, 'y')
        const max = _.maxBy(series.data, 'y')
        if (min) {
          lowestY = Math.min(lowestY, _.minBy(series.data, 'y').y)
        }
        if (max) {
          highestY = Math.max(highestY, _.maxBy(series.data, 'y').y)
        }
      }

      // filter out all scales not called 'x'
      for(var scale in this.$chart.options.scales) {
        if (scale != 'x') {
          delete this.$chart.options.scales[scale]
        }
      }

      for (var axisId in this.components.axis) {
        // wierd but necessary?
        // var axis = JSON.parse(JSON.stringify(this.components.axis[axisId]))
        var axis = this.components.axis[axisId]
        console.log('hello world!')
        axis.type = 'linear'
        this.$chart.options.scales[axis.id] = axis

        // if both max and suggestedMax is set
        if (axis.max != undefined && axis.suggestedMax != undefined) {
          if (highestY < axis.max) {
            axis.max = undefined
          }
        }

        // if both min and suggestedMin is set
        if (axis.min != undefined && axis.suggestedMin != undefined) {
          if (lowestY > axis.min) {
            axis.min = undefined
          }
        }

        // restore user ticks if necessary
        if (this.userMin) { axis.min = this.userMin }
        if (this.userMax) { axis.max = this.userMax }
      }

      // load datasets and thresholds
      this.$chart.data.datasets = []

      var thresholdOrder = 999

      for (var thresholdId in this.components.thresholds) {
        // copy threshold to non-watched object
        var threshold = Object.assign({}, this.components.thresholds[thresholdId])
        threshold.order = thresholdOrder
        thresholdOrder += 1
        this.$chart.data.datasets.push(threshold)
      }

      for (var seriesId in this.components.series) {
        var series = Object.assign({}, this.components.series[seriesId])
        this.$chart.data.datasets.push(series)
      }

      this.$chart.data.datasets.sort((a, b) => a.order - b.order)

      this.loading = false

      if(this.$chart.canvas) {
        this.$chart.update()
      }
    }
  }

})
</script>
<style>
.pi-chart {
  background: transparent;
  border: 1px solid #AAA;
  border-radius: 2px;
  position: relative;
  touch-action: pan-y;
  cursor: crosshair;
}
html.dark .pi-chart {
  background: #222;
  border: 1px solid #444;
}

.pi-chart-reset-zoom {
  position: absolute;
  width: 16px;
  height: 16px;
  left: 5px;
  opacity: 0.6;
  cursor: pointer;
  top: 5px;
  z-index: 99;
  background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAOFJREFUOBFjdJzzZ+v///+9GMgAjIyM25jI0Ies5T8yhyw2Iy5dnvP+i/749/cGAwMjAwcTk8b2JMbX2NRi9QJY898/+4FhI/T//z+hH0A2SIxoA378+7Me6DltmAYQGyQG4yPTWF0AdPZHRkaGozCFEDbjBxifaNph9u//IIxPAw4X4NOCKoc1FkCJi4HhP////wzWIOVQL3zcn8LijaqdgQGHCxCaQRogBv3nR9cM4mM1gIOJJRDotKswDSA2SAzGR6axegGkwG3Rf7Hfv/5eB7E5mJhxJiSQPEWAccBzIwBxFFVMvMQOrAAAAABJRU5ErkJggg==')
}
.pi-chart-reset-zoom:hover {
  opacity: 1;
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
html.dark .pi-chart .pi-loading {
  background-color: rgba(0,0,0,0.9);
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

.chartjs-zoombox-handle-horizontal div, .chartjs-zoombox-handle-vertical div {
	display: none;
}

.chartjs-zoombox-handle-both div {
	display: block;
}
.chartjs-zoombox-handle-both {
	position: absolute;
	left: 0px;
	right: 0px;
	top: 0px;
	bottom: 0px;
}

.chartjs-zoombox-handle-corner-0::after, 
.chartjs-zoombox-handle-corner-1::after,
.chartjs-zoombox-handle-corner-2::after,
.chartjs-zoombox-handle-corner-3::after {
	content: "";
	position: absolute;
	width: 3px;
	height: 20px;
	background: rgba(66,133,244,1);
}
.chartjs-zoombox-handle-corner-0::after { left: 0px; }
.chartjs-zoombox-handle-corner-1::after { right: 0px; }
.chartjs-zoombox-handle-corner-2::after { left: 0px; bottom: 0px; }
.chartjs-zoombox-handle-corner-3::after { right: 0px; bottom: 0px; }

.chartjs-zoombox-handle-corner-0::before,
.chartjs-zoombox-handle-corner-1::before,
.chartjs-zoombox-handle-corner-2::before,
.chartjs-zoombox-handle-corner-3::before {
	content: "";
	position: absolute;
	width: 20px;
	height: 3px;
	background: rgba(66,133,244,1);
}
.chartjs-zoombox-handle-corner-0::before { left: 0px; }
.chartjs-zoombox-handle-corner-1::before { right: 0px; }
.chartjs-zoombox-handle-corner-2::before { left: 0px; bottom: 0px; }
.chartjs-zoombox-handle-corner-3::before { right: 0px; bottom: 0px; }

.chartjs-zoombox-handle-horizontal {
	position: absolute;
	left: 0px;
	right: 0px;
}
.chartjs-zoombox-handle-horizontal::before {
	position: absolute;
	width: 4px;
	height: 40px;
	background: rgba(66,133,244,1);
	z-index: 999;
	left: -2px;
	top: -20px;
	content: '';
}
.chartjs-zoombox-handle-horizontal::after {
	position: absolute;
	width: 4px;
	height: 40px;
	background: rgba(66,133,244,1);
	z-index: 999;
	right: -2px;
	z-index: 999;
	top: -20px;
	content: '';
}

.chartjs-zoombox-handle-vertical {
	position: absolute;
	top: 0px;
	bottom: 0px;
}
.chartjs-zoombox-handle-vertical::before {
	position: absolute;
	width: 40px;
	height: 4px;
	background: rgba(66,133,244,1);
	z-index: 999;
	top: -2px;
	left: -20px;
	content: '';
}
.chartjs-zoombox-handle-vertical::after {
	position: absolute;
	width: 40px;
	height: 4px;
	background: rgba(66,133,244,1);
	left: -20px;
	z-index: 999;
	bottom: -2px;
	content: '';
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
