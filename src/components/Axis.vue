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
    }
  },
  computed: {

    data () {
      return {
        type: 'axis',
        id: 'y-axis-' + this._uid,
        position: this.position,
        scaleLabel: {
          display: this.label !== false,
          labelString: this.label
        },
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
      this.$parent.$emit('update', this._uid, this.data)
    }
  },
  created () {
    // passthrough updates from underlying elements
    this.$on('update', function (uid, data) {
      if (data.type === 'trend') {
        data.yAxisID = 'y-axis-' + this._uid
      }

      this.$parent.$emit('update', uid, data)
    }.bind(this))
    this.$on('delete', function (uid, data) {
      this.$parent.$emit('delete', uid, data)
    }.bind(this))
  },
  mounted () {
    this.$parent.$emit('update', this._uid, this.data)
  },
  beforeDestroy () {
    this.$parent.$emit('delete', this._uid, this.data)
  }
}
</script>
