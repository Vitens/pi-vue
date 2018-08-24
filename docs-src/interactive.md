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
The cascader is a convienient component for selecting element context
and path.

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
    context: "\\\\PISRV1\\NuGreen\\NuGreen"
  }}
}
</script>
```

**Output**
<ClientOnly>
<demo-cascader />
</ClientOnly>



