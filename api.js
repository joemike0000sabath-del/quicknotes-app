const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const notesList = document.querySelector("#notes-list");
const statusMessage = document.querySelector("#status");

let notes = [];

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }
  return response;
}

loadButton.addEventListener("click", loadNotes);

async function loadNotes() {
  loadButton.disabled = true;
  statusMessage.className = "status status--loading";
  statusMessage.textContent = "Loading notes...";

  try {
    const response = await request(`${API_URL}?_limit=10`);
    notes = await response.json();
    renderNotes();
    statusMessage.className = "status status--success";
    statusMessage.textContent = `Loaded ${notes.length} notes from the server.`;
  } catch (error) {
    console.error("Unable to load notes.", error);
    statusMessage.className = "status status--error";
    statusMessage.textContent = "Could not load notes. Please check your connection and try again.";
  } finally {
    loadButton.disabled = false;
  }
}

function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-message";
    emptyItem.textContent = "No notes found. Try loading notes from the server.";
    notesList.append(emptyItem);
    return;
  }

  for (const note of notes) {
    const item = document.createElement("li");
    item.className = "note-card";

    const title = document.createElement("h3");
    title.textContent = note.title;
    const body = document.createElement("p");
    body.textContent = note.body;

    item.append(title, body);
    notesList.append(item);
  }
}
