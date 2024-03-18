<template>
  <span>
    <slot></slot>
  </span>
</template>
<script>

import _ from 'lodash'

export default {
  name: 'axis',
  props: {
    position: {
      type: String,
      default: 'left'
    },
    label: {
      type: [String, Boolean],
      default: false
    },
    min: {
      type: Number,
      default: undefined
    },
    max: {
      type: Number,
      default: undefined
    },
    suggestedMin: {
      type: Number,
      default: undefined
    },
    suggestedMax: {
      type: Number,
      default: undefined
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
    }
  },
  computed: {

    chartStart () {
      return this.$parent.chartStart
    },
    chartEnd () {
      return this.$parent.chartEnd
    },
    uid() {
      return _.uniqueId()
    },

    data () {
      return {
        type: 'axis',
        id: 'y-axis-' + this.uid,
        position: this.position,
        title: {
          display: this.label !== false,
          text: this.label
        },
        stacked: this.stacked,
        grid: {
          display: this.grid,
          color: function() { document.querySelector('html').classList.contains('dark') ? '#666' : '#EEE' }
        },
        min: this.min,
        max: this.max,
        suggestedMin: this.suggestedMin,
        suggestedMax: this.suggestedMax,
        ticks: {
          color: function() { return this.fontColor == 'auto' ? this.defaultfontColor() : this.fontColor }.bind(this)
        }
      }
    }
  },
  watch: {
    data () {
      this.$parent.updateData(this.uid, this.data, 'axis')
    }
  },
  created () {

  },
  mounted () {
    this.$nextTick(() => {
      this.$parent.updateData(this.uid, this.data, 'axis')
    })
  },
  beforeUnmount () {
    this.$parent.deleteData(this.uid, this.data, 'axis')
  },
  methods: {
    gridColor() {
      return document.querySelector('html').classList.contains('dark') ? '#666' : '#EEE'
    },

    defaultfontColor() {
      return document.querySelector('html').classList.contains('dark') ? '#EEE' : '#333'
    },

    deleteData(uid, data, type) {
      this.$parent.deleteData(uid, data, type)
    },
    updateData(uid, data, type) {
      data.yAxisID = 'y-axis-' + this.uid
      this.$parent.updateData(uid, data, type)
    },
    setLoading(uid) {
      this.$parent.setLoading(uid)
    },
    setFinished(uid) {
      this.$parent.setFinished(uid)
    }
  }
}
</script>
