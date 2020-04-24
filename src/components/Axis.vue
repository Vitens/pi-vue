<template>
  <span>
    <slot></slot>
  </span>
</template>
<script>
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
    }
  },
  computed: {

    chartStart() {
      return this.$parent.chartStart
    },
    chartEnd() {
      return this.$parent.chartEnd
    },

    data () {
      return {
        type: 'axis',
        id: 'y-axis-' + this._uid,
        position: this.position,
        scaleLabel: {
          display: this.label !== false,
          labelString: this.label
        },
        stacked: this.stacked,
        ticks: {
          min: this.min,
          max: this.max,
          suggestedMin: this.suggestedMin,
          suggestedMax: this.suggestedMax
        }
      }
    }
  },
  watch: {
    data () {
      this.$parent.$emit('update', this._uid, this.data, 'axis')
    }
  },
  created () {
    // passthrough updates from underlying elements
    this.$on('loading', function (uid, type) {
      this.$parent.$emit('loading', uid, type)
    })
    this.$on('finish', function (uid, type) {
      this.$parent.$emit('finish', uid, type)
    })

    this.$on('update', function (uid, data, type) {
      if (type === 'trend') {
        data.yAxisID = 'y-axis-' + this._uid
      }
      this.$parent.$emit('update', uid, data, type)

    }.bind(this))

    this.$on('delete', function (uid, data, type) {
      this.$parent.$emit('delete', uid, data, type)
    }.bind(this))
  },
  mounted () {
    this.$parent.$emit('update', this._uid, this.data, 'axis')
  },
  beforeDestroy () {
    this.$parent.$emit('delete', this._uid, this.data, 'axis')
  }
}
</script>
