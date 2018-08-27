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
    context: "\\\\PISRV1\\NuGreen\\NuGreen\\Little Rock\\Distilling Process\\Equipment\\F-272"
  }}
}
</script>
<style>
.demo .pi-element-browser {
  width: 100%;
}
.demo {
  border: 1px solid #DDD;
  border-radius: 5px;
  padding: 10px;
}
</style>
