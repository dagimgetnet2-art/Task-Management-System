const VALID_PRIORITIES = ["Low", "Medium", "High"];

export function createTask({ title, description = "", priority = "Medium", dueDate = "" }) {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: description.trim(),
    priority,
    dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };
}

export function validateTask({ title, priority }) {
  if (typeof title !== "string" || title.trim() === "") {
    return "Please enter a task title.";
  }

  if (title.trim().length > 120) {
    return "The title must be 120 characters or fewer.";
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return "Please choose a valid priority.";
  }

  return null;
}

export function updateTask(tasks, id, changes) {
  return tasks.map(task => task.id === id ? { ...task, ...changes, id: task.id, createdAt: task.createdAt } : task);
}

export function deleteTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}

export function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}

export function getTaskStatistics(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  return { total: tasks.length, completed, pending: tasks.length - completed };
}
