<template>
  <div id='test'>
    <input type='text' v-model='test' :width='500' />
		{{test}}
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
	name: 'pootjess',
	data() { return {
		test: 'test1234'
	}},
})
</script>


<style>
#container {
  width: 500px;
}

</style>
