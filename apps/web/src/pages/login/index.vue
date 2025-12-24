<template>
  <div class="login-container">
    <div class="login-form-container">
      <div class="login-header">
        <h1>欢迎登录</h1>
        <p>请输入您的账号和密码</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { Lock, User } from '@element-plus/icons-vue';
import { type FormInstance, type FormRules } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userStore = useUserStore();

// 表单引用
const loginFormRef = ref<FormInstance>();

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
});

// 加载状态
const loading = ref(false);

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度应在 4 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在 6 到 20 个字符', trigger: 'blur' },
  ],
};

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    loading.value = true;

    const success = await userStore.login(loginForm.username, loginForm.password);

    if (success) {
      // 登录成功，跳转到重定向路径或首页
      const redirect = router.currentRoute.value.query.redirect as string;
      router.push(redirect || '/');
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;

  .login-form-container {
    width: 400px;
    padding: 40px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .login-header {
      text-align: center;
      margin-bottom: 30px;

      h1 {
        font-size: 24px;
        color: $text-color;
        margin-bottom: 10px;
      }

      p {
        font-size: $font-size-small;
        color: $text-color-gray;
      }
    }

    .login-form {
      .el-form-item {
        margin-bottom: 22px;
      }

      .login-button {
        width: 100%;
      }
    }

    .login-footer {
      text-align: center;
      margin-top: 20px;

      p {
        font-size: $font-size-small;
        color: $text-color-light;

        a {
          color: $color-primary;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }
}
</style>
