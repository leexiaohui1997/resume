<template>
  <div class="register-container">
    <div class="register-form-container">
      <div class="register-header">
        <h1>用户注册</h1>
        <p>创建您的账号</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-button"
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <p>已有账号？<router-link to="/login">立即登录</router-link></p>
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
const registerFormRef = ref<FormInstance>();

// 表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
});

// 加载状态
const loading = ref(false);

// 验证确认密码
const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

// 表单验证规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度应在 4 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '密码只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
};

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return;

  try {
    await registerFormRef.value.validate();
    loading.value = true;

    const success = await userStore.register(registerForm.username, registerForm.password);

    if (success) {
      // 注册成功，跳转到登录页
      router.push('/login');
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.register-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;

  .register-form-container {
    width: 400px;
    padding: 40px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .register-header {
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

    .register-form {
      .el-form-item {
        margin-bottom: 22px;
      }

      .register-button {
        width: 100%;
      }
    }

    .register-footer {
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
