<template>
  <main class="container">
    <h1>PXL Docker Lab: Node + Vue + Postgres</h1>

    <section class="card">
      <h2>System status</h2>
      <button @click="checkHealth">Check API health</button>
      <div v-if="health" class="status">
        <p><strong>Status:</strong> {{ health.status }}</p>
        <p><strong>Database time:</strong> {{ health.time }}</p>
      </div>
    </section>

    <section class="card">
      <h2>Todo list</h2>
      <form @submit.prevent="addTodo" class="todo-form">
        <input v-model="newTitle" placeholder="New task" required />
        <button type="submit">Add task</button>
      </form>
      <ul>
        <li v-for="todo in todos" :key="todo.id">{{ todo.title }}</li>
      </ul>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";

const health = ref(null);
const todos = ref([]);
const newTitle = ref("");

async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    health.value = await res.json();
  } catch {
    health.value = { status: "cannot reach the API", time: "-" };
  }
}

async function fetchTodos() {
  const res = await fetch("/api/todos");
  if (res.ok) todos.value = await res.json();
}

async function addTodo() {
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: newTitle.value })
  });
  if (res.ok) {
    newTitle.value = "";
    await fetchTodos();
  }
}

onMounted(fetchTodos);
</script>

<style>
:root { font-family: system-ui, Arial, sans-serif; }
.container { max-width: 600px; margin: 0 auto; padding: 2rem; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
.status { background: #f5f5f5; border-radius: 4px; padding: 0.5rem 1rem; margin-top: 1rem; }
.todo-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
input { flex-grow: 1; padding: 0.5rem; }
ul { list-style: none; padding: 0; }
li { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
</style>
