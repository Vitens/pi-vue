<template>
  <div class='demo'>
    <pi-cascader :context.sync='context' />
      <br />

    <strong>Selected Context: </strong><br />
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
<style>
.demo {
  border: 1px solid #DDD;
  border-radius: 5px;
  padding: 10px;
}
</style>
