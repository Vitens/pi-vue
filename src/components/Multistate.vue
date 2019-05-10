<template>
  <div :class='stateClass' class='multistate'>
    <span v-if='loading' class='el-icon-loading loading'></span>
    <slot v-else></slot>
  </div>
</template>

<script>

export default {
  name: 'multistate',
  props: {
    path: { default: '', type: String },
    context: { default: '', type: String },
    colors: { default: () => [[1, 'green'], [2, 'yellow'], [3, 'orange'], [4, 'red']], type: Array }
  },
  data () {
    return {
      loading: true,
      stateClass: '',
      value: null
    }
  },
  asyncComputed: {
    async calcClass () {
      this.loading = true
      this.stateClass = ''
      var path = this.$pi.parse(this.path, this.context)
      try {
        var value = await this.$pi.getValue(path, true)

        if (typeof value.Value === 'object') {
          value = value.Value.Value
        } else{
          value = value.Value
        }

        this.value = value

        for (var rule of this.colors) {
          if (value === true || value === false) {
            if (value === rule[0]) {
              this.stateClass = rule[1]
              break
            }
          } else {

            if (value <= rule[0]) {
              this.stateClass = rule[1]
              break
            }
          }
        }
        this.loading = false
      } catch (e) {
        this.loading = false
        console.log(e)
        this.stateClass = 'error'
      }
    }
  }
}
</script>
<style>
.red {
  background-color: #FF2323;
}
.green {
  background-color: #67B23A;
}
.yellow {
  background-color: #F6CA2A;
}
.orange {
  background-color: #FF6C00;
}
.multistate .loading {
  display: inline-block;
  padding: 7px;
}
.error {
  background: lightgray;
}
</style>
