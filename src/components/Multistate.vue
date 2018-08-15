<template>
  <div :class='stateClass' class='multistate'>
    <span v-if='loading' class='el-icon-loading loading'></span>
    <slot v-else></slot>
  </div>
</template>

<script>

export default {
  name: 'value',
  props: {
    path: { default: '', type: String },
    context: { default: '', type: String },
    colors: { default: () => [[1, 'green'], [2, 'yellow'], [3, 'orange'], [4, 'red']], type: Array }
  },
  data () {
    return {
      loading: true,
      stateClass: ''
    }
  },
  asyncComputed: {
    async calcClass () {
      this.loading = true
      this.stateClass = ''
      var path = this.$pi.parse(this.path, this.context)
      try {
        var value = await this.$pi.getValue(path, true)

        for (var rule of this.colors) {
          if (value.Value === true || value.Value === false) {
            if (value.Value === rule[0]) {
              console.log(value.Value, rule[0], rule[1])
              this.stateClass = rule[1]
              break
            }
          } else {
            if (value.Value <= rule[0]) {
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
  background: #FF2323;
}
.green {
  background: #67B23A;
}
.yellow {
  background: #F6CA2A;
}
.orange {
  background: #FF6C00;
}
.multistate .loading {
  display: inline-block;
  padding: 7px;
}
.error {
  background: lightgray;
}
</style>
