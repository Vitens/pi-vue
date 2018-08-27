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
<style>
.demo {
  border: 1px solid #DDD;
  border-radius: 5px;
  padding: 10px;
}
</style>
