<template>
  <div>
    <el-cascader
      class='pi-element-browser'
      v-model='selectedValue'
      :props="props"
      :options="options"
      placeholder="Element"
      @change="handleItemChange"
      change-on-select
      v-loading='loading'
      element-loading-spinner="el-icon-loading"
      ></el-cascader>
  </div>
</template>
<script>

import _ from 'lodash'

export default {

  props: ['context'],

  data () {
    return {
      loading: false,
      selectedValue: [],
      emittedValue: '',
      props: {
        value: 'WebId',
        label: 'Name',
        children: 'children'
      },
      options: []
    }
  },
  watch: {
    context (newContext) {
      // if context changed outside of component reload component
      if (newContext !== this.emittedValue) {
        this.load()
      }
    }
  },
  mounted () {
    if (this.context !== '') {
      this.load()
    }
  },
  methods: {
    async load () {
      this.loading = true
      this.options = []
      var parents = await this.$pi.getParents(this.context)

      var value = []
      var response = [parents[0]]
      var options = response

      for (var parent of parents) {
        value.push(parent.WebId)

        if (parent.HasChildren === false) {
          continue
        }

        var children = await this.$pi.getChildren(parent.WebId)
        for (var child of children) {
          if (child.HasChildren) { child.children = [] }
        }
        var element = this.findObject(parent.WebId, options)
        element.children = children
        options = element.children
      }

      this.selectedValue = value
      this.options = response

      this.loading = false
    },
    async handleItemChange (webIds) {
      var object = this.getObject(webIds)

      this.emittedValue = object.Path

      this.$emit('update:context', object.Path)

      if (object.HasChildren === false) {
        return
      }

      var children = await this.$pi.getChildren(_.last(webIds))

      for (var child of children) {
        if (child.HasChildren) {
          child.children = []
        }
      }

      this.$set(this.getObject(webIds), 'children', children)
    },

    getObject (webIds, options) {
      var children = this.options

      for (var webId of webIds) {
        var object = this.findObject(webId, children)
        children = object.children
      }

      return object
    },

    findObject (webId, options) {
      for (var obj of options) {
        if (obj.WebId === webId) {
          return obj
        }
      }
    }
  }

}
</Script>
<style>
.pi-element-browser .el-cascader__label {
  direction: rtl
}

@media only screen and (max-width: 600px) {

  .pi-element-browser {
    width: 100%;
    margin-bottom: 5px;
  }
  .pi-element-browser .el-cascader__label {
    direction: rtl
  }

  .el-cascader {
    width: 100%;
  }
  div.el-cascader-menus.el-popper {
    overflow-x: scroll;
    -webkit-overflow-scrolling: touch;
    left: 10px !important;
    right: 10px !important;
  }

}

</style>
