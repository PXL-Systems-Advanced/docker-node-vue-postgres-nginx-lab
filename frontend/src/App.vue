<template>
  <div class="container">
    <h1>PXL Docker Lab: Node + Vue + Postgres</h1>

    <div class="card">
      <h2>System Status</h2>
      <button @click="checkHealth">Check API Health</button>
      <div v-if="healthData" class="status-box">
        <p><strong>Status:</strong> {{ healthData.status }}</p>
        <p><strong>DB Time:</strong> {{ healthData.time }}</p>
      </div>
    </div>

    <div class="card">
      <h2>Todo List</h2>
      <form @submit.prevent="addTodo" class="todo-form">
        <input v-model="newTitle" placeholder="Enter a new task..." required />
        <button type="submit">Add Task</button>
      </form>
      <ul class="todo-list">
        <li v-for="todo in todos" :key="todo.id">
          {{ todo.title }} 
          <span v-if="todo.completed">✅</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Vite exposes env vars on import.meta.env
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const healthData = ref(null);
const todos = ref([]);
const newTitle = ref('');

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    healthData.value = await res.json();
  } catch (e) {
    healthData.value = { status: 'Error connecting to API', time: '-' };
  }
}

async function fetchTodos() {
  try {
    const res = await fetch(`${API_BASE}/todos`);
    if(res.ok) todos.value = await res.json();
  } catch (e) {
    console.error(e);
  }
}

async function addTodo() {
  if (!newTitle.value.trim()) return;
  try {
    const res = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.value })
    });
    if (res.ok) {
      newTitle.value = '';
      await fetchTodos();
    }
  } catch (e) {
    console.error(e);
  }
}

onMounted(fetchTodos);
</script>

<style>
/* Basic CSS for cleanliness */
:root { font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif; }
.container { max-width: 600px; margin: 0 auto; padding: 2rem; }
.card { border: 1px solid #ddd; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
.status-box { background: #f9f9f9; padding: 10px; margin-top: 10px; border-radius: 4px; }
.todo-form { display: flex; gap: 10px; margin-bottom: 1rem; }
input { flex-grow: 1; padding: 8px; }
ul { list-style: none; padding: 0; }
li { padding: 8px 0; border-bottom: 1px solid #eee; }
</style>
