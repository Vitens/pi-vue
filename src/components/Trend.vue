<template>
</template>
<script>
export default {
  name: 'trend',
  props: {
    label: {
      type: String,
      default: ''
    },
    path: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: '#33F'
    },
    width: {
      type: Number,
      default: 2
    },
    marker: {
      type: String,
      default: 'none'
    },
    markerSize: {
      type: Number,
      default: 2
    },
    context: {
      type: String,
      default: ''
    },
    stepped: {
      type: Boolean,
      default: false
    },
    line: {
      type: Boolean,
      default: true
    },
    stepped: {
      type: Boolean,
      default: false
    },
    recorded: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    pipath() { 
      if(this.context == '') {
        return this.path
      } else {
        return this.$pi.parse(this.path, this.context)
      }
    },
    
    data() { return {
      label: this.label,
      path: this.pipath,
      color: this.color,
      width: this.width,
      marker: this.marker,
      markersize: this.marker == 'none' ? 0 : this.markerSize,
      interpolate: !this.line,
      line: this.line,
      recorded: this.recorded,
      stepped: this.stepped
    }}
  },
  watch: {
    data() {
      this.$parent.$emit('update', this._uid, this.data)
    }
  },
  mounted() {
    this.$parent.$emit('update', this._uid, this.data)
  },
  beforeDestroy() {
    this.$parent.$emit('delete', this._uid, this.data)
  }
}
</script>
<style>
</style>

