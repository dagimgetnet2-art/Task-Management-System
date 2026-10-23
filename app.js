import {createTask,validateTask,updateTask,deleteTask,toggleTask,getTaskStatistics} from "./task.js";
import { loadTasks, saveTasks, loadTheme, saveTheme } from "./storage.js";
import { showError, clearError } from "./validation.js";

let tasks = loadTasks();
let currentFilter = "all";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const descriptionInput = document.getElementById("task-description");
const priorityInput = document.getElementById("task-priority");
const dueDateInput = document.getElementById("task-due-date");
const editingIdInput = document.getElementById("editing-id");
const formHeading = document.getElementById("form-heading");
const submitButton = document.getElementById("submit-button");
const cancelEditButton = document.getElementById("cancel-edit");
const errorElement = document.getElementById("form-error");
const searchInput = document.getElementById("search-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const pendingCount = document.getElementById("pending-count");
const themeToggle = document.getElementById("theme-toggle");

function persistAndRender() {
  const saved = saveTasks(tasks);
  if (!saved) {
    showError(errorElement, "Could not save tasks in this browser. Check available storage.");
  } else {
    clearError(errorElement);
  }
  render();
}

function getVisibleTasks() {
  const query = searchInput.value.trim().toLowerCase();

  return tasks.filter(task => {
    const searchableText = `${task.title} ${task.description}`.toLowerCase();
    const matchesSearch = searchableText.includes(query);
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "completed" && task.completed) ||
      (currentFilter === "pending" && !task.completed);

    return matchesSearch && matchesFilter;
  });
}

function makeBadge(text, className) {
  const badge = document.createElement("span");
  badge.className = `badge ${className}`;
  badge.textContent = text;
  return badge;
}

function renderTask(task) {
  const card = document.createElement("article");
  card.className = `task-card${task.completed ? " task-completed" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "pending" : "completed"}`);
  checkbox.addEventListener("change", () => {
    tasks = toggleTask(tasks, task.id);
    persistAndRender();
  });

  const main = document.createElement("div");
  main.className = "task-main";

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  main.appendChild(title);

  if (task.description) {
    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description;
    main.appendChild(description);
  }

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.appendChild(makeBadge(
    `${task.priority} priority`,
    `priority-${task.priority.toLowerCase()}`
  ));
  meta.appendChild(makeBadge(task.completed ? "Completed" : "Pending", "badge-neutral"));

  if (task.dueDate) {
    const dateBadge = makeBadge(`Due ${task.dueDate}`, "badge-neutral");
    meta.appendChild(dateBadge);
  }

  main.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "button button-secondary";
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => beginEdit(task));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "button button-danger";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    tasks = deleteTask(tasks, task.id);
    if (editingIdInput.value === task.id) resetForm();
    persistAndRender();
  });

  actions.append(editButton, deleteButton);
  card.append(checkbox, main, actions);
  return card;
}

function render() {
  const stats = getTaskStatistics(tasks);
  totalCount.textContent = stats.total;
  completedCount.textContent = stats.completed;
  pendingCount.textContent = stats.pending;

  taskList.replaceChildren();
  const visibleTasks = getVisibleTasks();
  visibleTasks.forEach(task => taskList.appendChild(renderTask(task)));

  emptyState.hidden = visibleTasks.length > 0;
  if (visibleTasks.length === 0) {
    emptyState.textContent = tasks.length === 0
      ? "No tasks yet. Add your first task above."
      : "No tasks match your search or filter.";
  }

  document.querySelectorAll("[data-filter]").forEach(button => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function resetForm() {
  form.reset();
  editingIdInput.value = "";
  formHeading.textContent = "Add a task";
  submitButton.textContent = "＋ Add task";
  cancelEditButton.hidden = true;
  clearError(errorElement);
}

function beginEdit(task) {
  editingIdInput.value = task.id;
  titleInput.value = task.title;
  descriptionInput.value = task.description;
  priorityInput.value = task.priority;
  dueDateInput.value = task.dueDate || "";
  formHeading.textContent = "Edit task";
  submitButton.textContent = "Save changes";
  cancelEditButton.hidden = false;
  clearError(errorElement);
  titleInput.focus();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const taskData = {
    title: titleInput.value,
    description: descriptionInput.value,
    priority: priorityInput.value,
    dueDate: dueDateInput.value
  };

  const validationError = validateTask(taskData);
  if (validationError) {
    showError(errorElement, validationError);
    titleInput.focus();
    return;
  }

  if (editingIdInput.value) {
    tasks = updateTask(tasks, editingIdInput.value, {
      ...taskData,
      title: taskData.title.trim(),
      description: taskData.description.trim()
    });
  } else {
    tasks.push(createTask(taskData));
  }

  resetForm();
  persistAndRender();
});

cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", render);

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    render();
  });
});

document.getElementById("clear-completed").addEventListener("click", () => {
  const completedCountNow = tasks.filter(task => task.completed).length;
  if (completedCountNow === 0) {
    showError(errorElement, "There are no completed tasks to clear.");
    return;
  }
  if (!window.confirm(`Delete all ${completedCountNow} completed task(s)?`)) return;
  tasks = tasks.filter(task => !task.completed);
  resetForm();
  persistAndRender();
});

document.getElementById("export-button").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tasks.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode";
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
}

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(nextTheme);
  saveTheme(nextTheme);
});

applyTheme(loadTheme());
render();
