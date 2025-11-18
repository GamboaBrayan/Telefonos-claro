<template>
  <div class="login-page">
    <div class="login-container">
      <h1>Crear Cuenta</h1>

      <form @submit.prevent="handleSignUp">
        <div class="input-group">
          <label for="email" class="input-label">Correo electrónico</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="ejemplo@correo.com"
            required
          />
        </div>

        <div 
          :class="['input-group', 'password-wrapper', { 'is-focused': isPasswordFocused }]"
        >
          <label for="password" class="input-label">Contraseña</label>
          <input
            id="password"
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Mínimo 6 caracteres"
            required
            @focus="isPasswordFocused = true"
            @blur="isPasswordFocused = false"
          />
          
          <button
            type="button"
            class="toggle-password"
            @click="toggleShowPassword"
            :aria-pressed="showPassword.toString()"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          >
             <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.57 18.57 0 0 1 4.06-5.94"></path><path d="M1 1l22 22"></path></svg>
             <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </div>
        
        <button type="submit" :disabled="loading" class="login-button">
          {{ loading ? "Registrando..." : "Registrarse" }}
        </button>

        <router-link to="/login" class="register-link">¿Ya tienes cuenta? Inicia Sesión</router-link>
      </form>
      
      <p v-if="error" class="error-message">{{ error }}</p>
      <p v-if="successMsg" class="success-message">{{ successMsg }}</p>
      
    </div>
  </div>
</template>

<script>
import { supabase } from "../lib/supabase"; // Asegúrate de que la ruta sea correcta

export default {
  name: "RegisterForm",
  data() {
    return {
      email: "",
      password: "",
      showPassword: false,
      loading: false,
      error: null,
      successMsg: null,
      isPasswordFocused: false,
      errorTimeout: null,
      successTimeout: null,
    };
  },
  methods: {
    toggleShowPassword() {
      this.showPassword = !this.showPassword;
    },
    async handleSignUp() {
      this.loading = true;
      this.error = null;
      this.successMsg = null;
      
      // Limpiar temporizadores anteriores
      clearTimeout(this.errorTimeout);
      clearTimeout(this.successTimeout);

      try {
        const { data, error } = await supabase.auth.signUp({
          email: this.email,
          password: this.password,
        });

        if (error) {
          throw error;
        }

        // Manejo de éxito
        const message = data.user 
            ? '¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.'
            : 'Registro exitoso, iniciando sesión...'; 

        this.successMsg = message;

        // Borrar mensaje de éxito después de 5 segundos
        this.successTimeout = setTimeout(() => {
          this.successMsg = null;
          // Opcional: Redirigir al usuario al login después del mensaje de éxito
          if (data.user) { 
            this.$router.push("/login");
          }
        }, 5000); 

      } catch (error) {
        console.error("Error de registro:", error.message);
        this.error = "Error al registrar: " + error.message;

        // Borrar mensaje de error después de 5 segundos
        this.errorTimeout = setTimeout(() => {
          this.error = null;
        }, 5000); 

      } finally {
        this.loading = false;
      }
    },
  },
  beforeUnmount() {
    clearTimeout(this.errorTimeout);
    clearTimeout(this.successTimeout);
  }
};
</script>

<style scoped>


.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb; 
  padding: 20px;
}

.login-container {
  max-width: 400px;
  width: 100%;
  padding: 40px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.login-container h1 {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 30px;
  color: #1e293b;
}

.login-container form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.login-container input {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  border: 1px solid #e2e8f0; 
  border-radius: 8px;
  transition: all 0.2s ease;
  background: #ffffff;
}

/* Enfoque (Focus) */
.login-container input:focus {
  border-color: #E30613;
  outline: none;
  box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.2);
}

/* Password Wrapper y Botón Ocultar/Mostrar */
.password-wrapper input {
  padding-right: 48px;
}

.password-wrapper.is-focused input {
  border-color: #E30613;
  box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.15);
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 70%;
  transform: translateY(-50%);
  height: 36px;
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #64748b;
  padding: 0;
  z-index: 10;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: #E30613;
}

/* Botón de Registro */
.login-button {
  padding: 14px;
  font-size: 17px;
  font-weight: 700;
  border-radius: 8px;
  border: none; 
  background: #E30613; 
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
  box-shadow: 0 4px 10px rgba(227, 6, 19, 0.3);
}

.login-button:hover:not(:disabled) {
  background: #b80510;
}

.login-button:disabled {
  opacity: 0.6;
  background: #E30613;
}

/* Link a Login */
.register-link {
  font-size: 14px;
  margin-top: 5px;
  color: #E30613;
  font-weight: 600;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}

/* Mensaje de Error (Fuera del Form) */
.error-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #fee2e3; 
  color: #E30613;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(227, 6, 19, 0.1);
}

/* Mensaje de Éxito */
.success-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #d1fae5; /* Verde light suave para éxito */
  color: #065f46; /* Verde oscuro para el texto */
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(6, 95, 70, 0.1);
}
</style>