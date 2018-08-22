# Basic Components
PiVue comes with two basic components; ```<pi-value>``` for
displaying single values and ```<pi-multistate>``` for multistates.
## Value
Use the ```<pi-value>``` component to display single values.
### Usage
**Input**
```vue
<pi-value 
  context="\\PISRV1\NuGreen\NuGreen\Houston\Milling Process\Equipment\B-209" 
  path=".|Fuel Gas Flow"
  units="auto"
  :precision="3"
/>
```

**Output**
<div class='demo'>
<ClientOnly>
<pi-value 
  context="\\PISRV1\NuGreen\NuGreen\Houston\Milling Process\Equipment\B-209" 
  path=".|Fuel Gas Flow"
  units="auto"
  :precision="3"
/>
</ClientOnly>
</div>

<style>
div.demo {
padding: 15px;
border-radius: 5px;
border: 1px solid #DDD;
}
</style>

### Value Attributes

| Attribute | Description | Type | Accepted Values | Default |
| --------- | ----------- | ---- | --------------- | ------- |
| **context**   | Context of the component  | string | - | - |
| **path**   | Context-relative path to attribute | string | - | - |
| **units**   | Units, enter auto for automatic units | string | - | - |
| **precision**   | Value precision | number | - | 2 |

::: tip
If the context of the component is not set, PIVue tries to infer the
context of the parent component
:::


## MultiState
A multistate is a container that changes class based on the value and
set of rules. A multistate can be wrapped around any other elements.
### Usage
**Input**
```vue
<pi-multistate 
  context="\\PISRV1\NuGreen\NuGreen\Houston\Milling Process\Equipment\B-209" 
  path=".|Fuel Gas Flow"
  :colors="[[50, 'green'], [75, 'orange'], [90, 'red']]">
    <!-- the embedded pi-value inherits the context of its parent element -->
    <pi-value path=".|Fuel Gas Flow"/>
</pi-multistate>

<style>
/* use CSS to style the states */
.red {
  background: #FF2323;
}
.green {
  background: #67B23A;
}
.yellow {
  background: #F6CA2A;
}
.multistate {
  padding: 10px;
  width: 100px;
}
</style>
```

**Output**
<div class='demo'>
<ClientOnly>
<pi-multistate 
  context="\\PISRV1\NuGreen\NuGreen\Houston\Milling Process\Equipment\B-209" 
  path=".|Fuel Gas Flow"
  :colors="[[50, 'green'], [75, 'orange'], [90, 'red']]">
    <pi-value path=".|Fuel Gas Flow"/>
</pi-multistate>
</ClientOnly>
</div>

<style>
/* use CSS to style the states */
.red {
  background: #FF2323;
}
.green {
  background: #67B23A;
}
.yellow {
  background: #F6CA2A;
}
.multistate {
  padding: 10px;
  width: 100px;
}
</style>

### Value Attributes

| Attribute | Description | Type | Accepted Values | Default |
| --------- | ----------- | ---- | --------------- | ------- |
| **context**   | Context of the component  | string | - | - |
| **path**   | Context-relative path to attribute | string | - | - |
| **colors**   | Colors/States | Array | - | ```[[1, 'green'], [2, 'yellow'], [3, 'orange'], [4, 'red']]```|
