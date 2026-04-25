const STORAGE_KEY = "work_tracker_items_v1";

const taskForm = document.getElementById("taskForm");
const statsEl = document.getElementById("stats");
const taskListEl = document.getElementById("taskList");
const filterAreaEl = document.getElementById("filterArea");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const taskTemplate = document.getElementById("taskTemplate");

/** @type {Array<{id:string,title:string,area:string,priority:string,dueDate:string,notes:string,done:boolean}>} */
let tasks = loadTasks();

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function formatDueDate(dateValue) {
  if (!dateValue) return "No due date";
  const date = new Date(`${dateValue}T00:00:00`);
  return `Due ${date.toLocaleDateString()}`;
}

function computeStats(currentTasks) {
  const total = currentTasks.length;
  const done = currentTasks.filter((task) => task.done).length;
  const open = total - done;
  const byArea = currentTasks.reduce((acc, task) => {
    acc[task.area] = (acc[task.area] || 0) + 1;
    return acc;
  }, {});

  return { total, done, open, byArea };
}

function renderStats() {
  const { total, done, open, byArea } = computeStats(tasks);
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

  const baseStats = [
    `Total items: ${total}`,
    `Open items: ${open}`,
    `Completed items: ${done}`,
    `Completion rate: ${completion}%`,
  ];

  const areaStats = Object.entries(byArea).map(([area, count]) => `${area}: ${count}`);

  statsEl.innerHTML = [...baseStats, ...areaStats]
    .map((line) => `<div class="stat">${line}</div>`)
    .join("");
}

function renderTasks() {
  const filter = filterAreaEl.value;
  const filteredTasks = tasks.filter((task) => filter === "All" || task.area === filter);

  taskListEl.innerHTML = "";

  if (filteredTasks.length === 0) {
    taskListEl.innerHTML = `<div class="stat">No work items yet for this filter.</div>`;
    return;
  }

  filteredTasks
    .sort((a, b) => Number(a.done) - Number(b.done))
    .forEach((task) => {
      const node = taskTemplate.content.cloneNode(true);

      const card = node.querySelector(".task-card");
      const title = node.querySelector(".task-title");
      const area = node.querySelector(".badge.area");
      const notes = node.querySelector(".task-notes");
      const priority = node.querySelector(".badge.priority");
      const due = node.querySelector(".due");
      const toggleBtn = node.querySelector(".toggle");
      const deleteBtn = node.querySelector(".delete");

      title.textContent = task.title;
      area.textContent = task.area;
      notes.textContent = task.notes || "No notes";
      priority.textContent = task.priority;
      priority.classList.add(`priority-${task.priority.toLowerCase()}`);
      due.textContent = formatDueDate(task.dueDate);

      if (task.done) {
        card.classList.add("done");
        toggleBtn.textContent = "Mark Open";
      }

      toggleBtn.addEventListener("click", () => {
        tasks = tasks.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item));
        saveTasks();
        render();
      });

      deleteBtn.addEventListener("click", () => {
        tasks = tasks.filter((item) => item.id !== task.id);
        saveTasks();
        render();
      });

      taskListEl.appendChild(node);
    });
}

function render() {
  renderStats();
  renderTasks();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const area = document.getElementById("area").value;
  const priority = document.getElementById("priority").value;
  const dueDate = document.getElementById("dueDate").value;
  const notes = document.getElementById("notes").value.trim();

  if (!title) return;

  tasks.push({
    id: makeId(),
    title,
    area,
    priority,
    dueDate,
    notes,
    done: false,
  });

  saveTasks();
  taskForm.reset();
  document.getElementById("priority").value = "Medium";
  render();
});

filterAreaEl.addEventListener("change", renderTasks);

clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  render();
});

render();
