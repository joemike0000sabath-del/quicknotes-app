const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const notesList = document.querySelector("#notes-list");
const statusMessage = document.querySelector("#status");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");

let notes = [];
let pendingRequests = 0;

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }
  return response;
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

async function loadNotes() {
  setRequestRunning(true);
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
    setRequestRunning(false);
  }
}

async function createNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();

  if (!title) {
    setStatus("A title is required.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    setStatus("The title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  setRequestRunning(true);
  setStatus("Creating note...", "loading");

  try {
    const response = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ title, body: bodyInput.value, userId: 1 }),
    });
    const createdNote = await response.json();

    // JSONPlaceholder simulates writes but does not persist them across reloads.
    notes.unshift(createdNote);
    renderNotes();
    noteForm.reset();
    setStatus(`Note created (status ${response.status}, id ${createdNote.id}).`, "success");
  } catch (error) {
    console.error("Unable to create note.", error);
    setStatus("Could not create the note. Please check your connection and try again.", "error");
  } finally {
    setRequestRunning(false);
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
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteNote(note.id));

    item.append(title, body, deleteButton);
    notesList.append(item);
  }
}

async function deleteNote(noteId) {
  setRequestRunning(true);
  setStatus("Deleting note...", "loading");

  try {
    await request(`${API_URL}/${encodeURIComponent(noteId)}`, { method: "DELETE" });
    // JSONPlaceholder reports successful deletes but does not persist them; remove it from this view.
    notes = notes.filter((note) => note.id !== noteId);
    renderNotes();
    setStatus("Note deleted.", "success");
  } catch (error) {
    console.error("Unable to delete note.", error);
    setStatus("Could not delete the note. Please check your connection and try again.", "error");
  } finally {
    setRequestRunning(false);
  }
}

function setStatus(message, state) {
  statusMessage.className = `status status--${state}`;
  statusMessage.textContent = message;
}

function setRequestRunning(isRunning) {
  pendingRequests += isRunning ? 1 : -1;
  const hasPendingRequests = pendingRequests > 0;
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = hasPendingRequests;
  });
}
