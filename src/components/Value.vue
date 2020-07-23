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
    path: { default: '', type: String },
    context: { default: '', type: String },
    units: { default: '', type: String },
    precision: { default: 2, type: Number },
    conversion: { default: 1, type: Number },
    locale: { default: false, type: Boolean },
    static: Boolean
  },
  data () {
    return {
      error: '',
      loading: true,
      value: {
        Value: ''
      }
    }
  },
  asyncComputed: {
    async value () {
      try {
        this.loading = true
        this.error = ''
        this.value = { Value: '' }
        var path = ''

        if (this.context === '') {
          path = this.$pi.parse(this.path, this.$parent.context)
        } else {
          path = this.$pi.parse(this.path, this.context)
        }

        var value = await this.$pi.getValue(path, this.static)
        if (!value.Good || value.Value === -99999) {
          value.Value = '-'
        }
        if (typeof (value.Value) === 'object') {
          value.Value = value.Value.Name
        }
        this.loading = false
        return value
      } catch (e) {
        this.error = e
        this.loading = false
        console.log(e)
        return {}
      }
    }
  },

  computed: {
    formattedValue () {
      if (!this.value) {
        return ''
      }

      if (isNaN(this.value.Value) || this.value.Value == '') {
        return this.value.Value
      } else {
        const val = (parseFloat(this.value.Value) * this.conversion)
        return this.locale ? val.toLocaleString('nl-NL', { minimumFractionDigits: this.precision, maximumFractionDigits: this.precision }) : val.toFixed(this.precision)
      }
    },
    displayUnits () {
      if (this.units == 'auto') {
        if (this.value && this.value.UnitsAbbreviation) {
          return this.value.UnitsAbbreviation
        } else {
          return ''
        }
      } else {
        return this.units
      }
    }
  }
}
</script>
<style>
.error {
  color: red;
}
</style>
