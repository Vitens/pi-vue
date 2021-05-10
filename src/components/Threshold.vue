<template>
<i></i>
</template>
<script>
export default {
  name: 'threshold',
  props: {
    value: {
      type: Number,
      default: undefined
    },
    color: {
      type: String,
      default: '#33F'
    },
    mode: {
      type: String,
      default: 'ge'
    },
    path: {
      type: String,
      default: ''
    },
    context: {
      type: String,
      default: ''
    },
    conversion: {
      type: Number,
      default: 1
    },
    timeShift: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      lineData: []
    }
  },
  computed: {

    reloadTrigger () {
      return {
        path: this.path,
        context: this.context
      }
    },

    data () {
      return {
        type: 'scatter',
        // value: (this.value == undefined) ? this.tvalue * this.conversion : this.value * this.conversion,
        borderColor: this.color,
        fill: false,
        interpolate: false,
        steppedLine: true,
        order: 999,
        threshold: this.mode,
        showLine: true,
        borderWidth: 1.5,
        pointRadius: 0,
        data: this.lineData,
        setMax: this.setMax
      }
    }
  },
  watch: {
    reloadTrigger () {
      this.requestLoad()
    },
    '$parent.chartStart' () {
      this.requestLoad()
    },
    '$parent.chartEnd' () {
      this.requestLoad()
    },
    data () {
      this.$parent.$emit('update', this._uid, this.data, 'threshold')
    }
  },
  created () {
    this.requestLoad = _.debounce(function () {
      this.loadData()
    }, 10)
  },
  mounted () {
    this.$parent.$emit('update', this._uid, this.data, 'threshold')

    this.$nextTick(function () {
      this.requestLoad()
    }.bind(this))
  },
  beforeDestroy () {
    console.log('destroy threshold')
    this.$parent.$emit('delete', this._uid, this.data, 'threshold')
  },
  methods: {
    async loadData () {
      var value = this.value
      if (value == null) {
        var values = await this.$pi.getRecorded(this.$pi.parse(this.path, this.context), this.$parent.chartStart, this.$parent.chartEnd, 10000, 'interpolated')
        this.lineData = []

        var index = 0
        for (var val of values) {
          var x = (index > 0 && index < values.length) ? new Date(new Date(val.Timestamp).getTime() + this.timeShift) : new Date(val.Timestamp)
          console.log(index, x, this.timeShift)
          this.lineData.push({
            x: x,
            y: val.Value * this.conversion
          })
          index += 1
        }
      } else {
        // single value
        this.lineData = [{ x: this.$pi.parseTime(this.$parent.chartStart), y: value * this.conversion },
                         { x: this.$pi.parseTime(this.$parent.chartEnd), y: value * this.conversion }]
      }
    }
  }
}
</script>
<style>
</style>

