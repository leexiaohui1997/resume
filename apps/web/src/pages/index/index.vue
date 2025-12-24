<template>
  <div class="section">
    <div class="title">你的专业简历制作助手</div>
    <div class="desc">3分钟创建一份专业且美观的简历</div>
    <el-button type="primary">开始制作简历</el-button>
  </div>
</template>

<style lang="scss" scoped>
.section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  .title {
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .desc {
    color: $text-color-light;
    font-size: 18px;
  }

  .el-button {
    margin-top: 24px;
    height: 60px;
    width: 200px;
    border-radius: 60px;
    font-size: 18px;
  }
}
</style>
