# Charting
PiVue currently only allows for simple line trends and thresholds.
Charts can be zoomed and exported.

## Basic Charts

You can build charts consisting of multiple trends using the 
```<pi-chart>``` and ```<pi-trend>``` components.
### Usage
**Input**
```vue
<pi-chart title='Basic Chart' legend='top'>
  <pi-trend context="\\PISRV1\NuGreen\NuGreen\Little Rock" path=".|Environment" 
   color='red' :line='false' marker='rect' label='Little Rock'/>
  <pi-trend context="\\PISRV1\NuGreen\NuGreen\Houston" path=".|Environment" 
   label='Houston' stepped/>
</pi-chart>
```
**Output**
<ClientOnly>
<pi-chart title='Basic Chart' legend='top'>
<pi-trend context="\\PISRV1\NuGreen\NuGreen\Little Rock" path=".|Environment" color='red' marker='rect' label='Little Rock' stepped/>
<pi-trend context="\\PISRV1\NuGreen\NuGreen\Houston" path=".|Environment" label='Houston' />
</pi-chart>
</ClientOnly>


### ```pi-chart``` attributes

| Attribute | Description | Type | Accepted Values | Default |
| --------- | ----------- | ---- | --------------- | ------- |
| **start**   | Start time  | string | - | *-24h |
| **end**   | End time  | string | - | * |
| **responsive**   | Responsive chart  | boolean | - | true |
| **maintain-aspect-ratio**   | Maintain aspect ratio  | boolean | - | true |
| **tooltips**   | Display tooltips  | boolean | - | true |
| **title**   | Chart title  | string | - | - |
| **y-label**   | Y-axis Label | string | - | - |
| **min**   | Y-axis hard min | number | - | - |
| **max**   | Y-axis hard max | number | - | - |
| **suggested-min**   | Y-axis suggested min | number | - | - |
| **suggested-max**   | Y-axis suggested max | number | - | - |
| **legend**   | Legend position | string | none/top/bottom/left/right | none |

### ```pi-trend``` attributes

| Attribute | Description | Type | Accepted Values | Default |
| --------- | ----------- | ---- | --------------- | ------- |
| **context**   | Context of the component  | string | - | - |
| **path**   | Context-relative path to attribute | string | - | - |
| **label**   | Legend label | string | - | - |
| **color**   | Trend color | string | - | #33F |
| **width**   | Trend width | number | - | 2 |
| **marker**   | Trend marker | string | none / [chartjs options](https://www.chartjs.org/docs/latest/configuration/elements#point-styles) |  |
| **marker-size**   | Trend marker size | number | - | 2 |
| **stepped**   | Stepped trend | boolean | - | false |
| **line**   | Draw trend line | boolean | - | true |
| **recorded**   | Use recorded instead of plot-values | boolean | - | false |


## Thresholding Data
Use ```<pi-threshold>``` to add thresholds to your charts:
```vue
<pi-chart>
  <pi-trend context="\\PISRV1\NuGreen\NuGreen\Houston" path=".|Environment"/>
  <pi-threshold :value='75' color='red'/>
  <pi-threshold :value='25' color='green' mode='le'/>
</pi-chart>
```
**Output**
<ClientOnly>
<pi-chart title='Chart with Threshold lines'>
  <pi-trend context="\\PISRV1\NuGreen\NuGreen\Houston" path=".|Environment" />
  <pi-threshold :value='75' color='red' mode='ge'/>
  <pi-threshold :value='50' color='green' mode='le'/>
</pi-chart>
</ClientOnly>

### ```pi-threshold``` attributes

| Attribute | Description | Type | Accepted Values | Default |
| --------- | ----------- | ---- | --------------- | ------- |
| **value**   | Threshold value | number | - | - |
| **color**   | Line color | string | - | #33F |
| **mode**   | Mode (greater-or-equal or lower-or-equal) | ge/le | - | ge |

