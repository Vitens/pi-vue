<template>
  <span class='value'>
    <span v-if='loading' class='el-icon-loading'></span>
    <span v-if="error != ''" class='error'>...</span>
    <span v-if='!loading'>{{formattedValue}}</span>
    <span v-if="units != ''" class='units'>{{displayUnits}}</span>
  </span>
</template>

<script>
export default {
  name: 'value',
  props: {
    path: {default: '', type: String},
    context: {default: '', type: String},
    units: {default: '', type: String},
    precision: {default: 2, type: Number},
    static: Boolean,
  },
  data() {
    return {
      error: '',
    }
  },
  asyncComputed: {
    async value() {
        try {
          this.error = ''
          this.value = {Value: '', loading: true}
          var path = ''
          if(this.context == '') {
            path = this.$pi.parse(this.path, this.$parent.context)
          } else {
            path = this.$pi.parse(this.path, this.context)
          }
          var value = await this.$pi.getValue(path, this.static)
          if(!value.Good) {
            value.Value = 'No Data'
          }
          return value
        } catch(e) {
          this.error = e
          console.log(e)
          return {}
        }
    },
  },

  computed: {
    loading() {
      return this.value.loading == true
    },
    formattedValue() {
      if(isNaN(this.value.Value) || this.value.Value == "") {
        return this.value.Value
      } else {
        return this.value.Value.toFixed(this.precision)
      }
    },
    displayUnits() {
      if(this.units == "auto") {
        return this.value.UnitsAbbreviation
      } else {
        return this.units
      }
    }
  },
}
</script>
<style>
.error {
  color: red;
}
</style>
