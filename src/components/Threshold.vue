<template>
</template>
<script>
export default {
  name: 'threshold',
  props: {
    value: {
      type: Number,
      default: null
    },
    color: {
      type: String,
      default: '#33F'
    },
    mode: {
      type: String,
      default: 'ge'
    }
  },
  computed: {

    data () {
      return {
        type: 'threshold',
        value: this.value,
        path: this.pipath,
        color: this.color,
        mode: this.mode
      }
    }
  },
  watch: {
    data () {
      this.$parent.$emit('update', this._uid, this.data)
    }
  },
  mounted () {
    this.$parent.$emit('update', this._uid, this.data)
  },
  beforeDestroy () {
    this.$parent.$emit('delete', this._uid, this.data)
  }
}
</script>
<style>
</style>

