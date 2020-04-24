<template>
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
    setMax: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tvalue: null
    }
  },
  computed: {

    data () {
      return {
        type: 'threshold',
        value: (this.value == undefined) ? this.tvalue * this.conversion : this.value * this.conversion, 
        path: this.path,
        context: this.context,
        color: this.color,
        mode: this.mode, 
        setMax: this.setMax
      }
    }
  },
  watch: {
    data () {
      this.$parent.$emit('update', this._uid, this.data, 'threshold')
    },
  },
  mounted () {
    this.loadData()
    this.$parent.$emit('update', this._uid, this.data, 'threshold')
  },
  beforeDestroy () {
    this.$parent.$emit('delete', this._uid, this.data, 'threshold')
  },
  methods: {
    async loadData() {

        var value = this.value
        if (value == null) {
          value = await this.$pi.getValue(this.$pi.parse(this.path, this.context))
          if(value.Good) {
            this.tvalue = value.Value
          } else {
            this.tvalue = undefined
          }
        } else {
          this.tvalue = value
        }
    }
  }
}
</script>
<style>
</style>

