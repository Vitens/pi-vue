# Interactive Components

## Using interactive components
::: tip
Interactive Components are built using [ElementUI](http://element.eleme.io/#/en-US). To use these components you'll need to import ElementUI in your project before importing PIVue
:::

```js
// shell: yarn add element-ui

import ElementUI from 'element-ui'
// import styles
import 'element-ui/lib/theme-chalk/index.css';
import 'element-ui/lib/theme-chalk/display.css';

Vue.use(ElementUI)
```

## Cascader
You can use the cascader component to browse through an AF Element structure.
### Usage
**Input**
```vue
<template>
  <div>
    <pi-cascader :context.sync='context' />

    <strong>Selected Context: <br /></strong>
    {{context}}
  </div>
</template>
<script>
export default {
  data() { return {
    context: "\\PISRV1\NuGreen\NuGreen\Little Rock\Distilling Process\Equipment\F-272"
  }}
}
</script>
```
<ClientOnly>
<demo-cascader />
</ClientOnly>

**Output**

## Tree
### Usage
**Input**
```vue
<template>
  <div class='demo'>
    <el-row>
      <el-col :span='12'>
        <h4>Context</h4>
        <pi-tree :context.sync='context' mode='element' />
      </el-col>
      <el-col :span='12'>
        <h4>Path</h4>
        <pi-tree :context.sync='context' :path.sync='path' mode='attribute' />
      </el-col>
    </el-row>
    <br />

    <strong>Selected Context / Path: </strong><br />
    {{context}} <br />
    {{path}} <br />
    <pi-value :path='path' :context='context' />
  </div>

</template>
<script>
export default {
  data() { return {
    context: "\\\\PISRV1\\NuGreen\\NuGreen\\Little Rock\\Distilling Process\\Equipment\\F-272",
    path: ""
  }}
}
</script>
```

**Output**
<ClientOnly>
<demo-tree />
</ClientOnly>
