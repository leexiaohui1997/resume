<template>
  <div v-if="user.isLogined" class="user-info">
    <el-dropdown placement="bottom-end" @command="handleCommand">
      <div class="user-avatar-container">
        <el-avatar
          :src="user.profile?.avatarUrl"
          :size="32"
          :alt="user.profile?.username || '用户头像'"
          @error="handleAvatarError"
        >
          <img src="@/assets/images/default-avatar.png" alt="默认头像" />
        </el-avatar>
        <span class="user-name">
          {{ user.profile?.username }}
          <el-icon class="el-icon--right">
            <ArrowDown />
          </el-icon>
        </span>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="profile">个人资料</el-dropdown-item>
          <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
  <el-space v-else class="user-action" :size="24">
    <el-button link @click="redirectTo('login')">登录</el-button>
    <el-button link @click="redirectTo('register')">注册</el-button>
  </el-space>
</template>

<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';

const user = useUserStore();

const router = useRouter();
const redirectTo = (path: string) => {
  router.push(path);
};

// 处理头像加载错误
const handleAvatarError = () => {
  return true; // 返回 true 表示使用默认头像
};

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      // 跳转到个人资料页面
      router.push('/profile');
      break;
    case 'logout':
      // 退出登录
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });

        await user.logout();
        ElMessage.success('已成功退出登录');
      } catch {
        // 用户取消操作
        console.log('用户取消退出登录');
      }
      break;
  }
};
</script>

<style scoped lang="scss">
.user-info {
  .user-avatar-container {
    display: flex;
    align-items: center;
    cursor: pointer;

    .el-avatar {
      margin-right: 8px;
      border: 1px solid $border-color-base;
    }

    .user-name {
      display: flex;
      align-items: center;
      font-size: $font-size-small;
      color: $text-color-light;

      &:hover {
        color: $color-primary;
      }
    }
  }
}

.user-action {
  font-size: $font-size-small;
}
</style>
