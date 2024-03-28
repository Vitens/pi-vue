<script>
import { defineComponent } from 'vue';
// Uncomment import and local "components" registration if library is not registered globally.
// import { PiVueSample } from '@/entry.esm';

export default defineComponent({
  name: 'ServeDev',
  // components: {
  //  PiVueSample,
  // }
});
</script>

<template>
  <div id="app">
    <pi-vue-sample />
  </div>
</template>
