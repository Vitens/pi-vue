<template>
  <div class='pi-tree'>
    <el-tree
      v-if='visible'
      :props="props"
      :data='options'
      :load='loadNode'
      :current-node-key='context'
      :highlight-current='true'
      node-key='Path'
      lazy
      ref='tree'
      v-loading='loading'
      :default-expanded-keys="keys"
      @node-click='setContext'
      ></el-tree>
  </div>
</template>
<script>

export default {

  props: ['context', 'path', 'mode'],

  data () {
    return {
      loading: false,
      visible: true,
      selectedValue: [],
      emittedValue: '',
      props: {
        label: 'Name',
        children: 'children',
        isLeaf: 'leaf'
      },
      options: []
    }
  },
  watch: {
    context (val) {
      this.$refs.tree.setCurrentKey(val)
      if (this.mode === 'attribute') {
        this.options = []
        this.visible = false
        this.$nextTick(function() {
          this.visible = true

        }.bind(this))
      }
    }
  },
  computed: {
    keys () {
      var keys = []

      if (this.mode === 'element') {
        var split = this.context.split('\\')
        var key = '\\\\' + split[2] + '\\' + split[3]

        for (var i = 4; i < split.length; i++) {
          key += '\\' + split[i]
          keys.push(key)
        }
      } else {
        var split = this.path.split('|')
      }
      return keys
    }
  },
  methods: {
    async loadNode (node, resolve) {
      if (node.level === 0) {
        if (this.mode === 'element') {
          resolve([{ Name: 'NuGreen', Path: this.keys[0], isLeaf: false }])
          return
        }
      }

      if (this.mode === 'element') {
        var children = await this.$pi.getChildren(node.data.Path)
      } else {
        if(node.level === 0) {
          var children = await this.$pi.getAttributes(this.context)
        } else {
          var children = await this.$pi.getAttributes(node.data.Path)
        }
      }

      for (var child of children) {
        child.leaf = !child.HasChildren
      }
      resolve(children)

      this.$refs.tree.setCurrentKey(this.context)
    },

    setContext (node) {
      if(this.mode === 'element') {
        this.$emit('update:context', node.Path)
      } else {
        var path = node.Path.replace(this.context, ".")
        this.$emit('update:path', path)
      }
    }

  }

}
</script>
<style>
</style>
</template>
