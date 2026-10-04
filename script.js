const noteForm = document.querySelector("#note-form");
const noteInput = document.querySelector("#note-input");
const categorySelect = document.querySelector("#category-select");
const notesList = document.querySelector("#notes-list");
const errorMessage = document.querySelector("#error-message");
const noteCount = document.querySelector("#note-count");
const searchInput = document.querySelector("#search-input");
const clearAllButton = document.querySelector("#clear-all-button");
const storageKey = "quicknotes-notes";
const categories = new Set(["Personal", "Work", "Study"]);

let notes = loadNotes();

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!noteInput.value.trim()) {
    errorMessage.textContent = "Please type a note first.";
    return;
  }

  if (noteInput.value.length > 200) {
    errorMessage.textContent = "Notes must be 200 characters or fewer.";
    return;
  }

  const note = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: noteInput.value,
    category: categorySelect.value,
    createdAt: new Date().toLocaleString(),
  };

  notes.push(note);
  noteInput.value = "";
  errorMessage.textContent = "";
  saveNotes();
  renderNotes();
});

searchInput.addEventListener("input", renderNotes);

clearAllButton.addEventListener("click", () => {
  if (!confirm("Delete all notes?")) {
    return;
  }

  notes = [];
  saveNotes();
  renderNotes();
});

function renderNotes() {
  notesList.replaceChildren();
  noteCount.textContent = getNoteCountMessage(notes.length);
  clearAllButton.disabled = notes.length === 0;

  const searchTerm = searchInput.value.trim().toLocaleLowerCase();
  const visibleNotes = notes.filter((note) =>
    note.text.toLocaleLowerCase().includes(searchTerm)
  );

  if (searchTerm && visibleNotes.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No notes match your search.";
    notesList.append(emptyMessage);
    return;
  }

  for (const note of visibleNotes) {
    const noteCard = document.createElement("li");
    noteCard.className = `note-card category-${note.category.toLowerCase()}`;

    const noteText = document.createElement("p");
    noteText.textContent = note.text;

    const noteMeta = document.createElement("div");
    noteMeta.className = "note-meta";

    const noteDetails = document.createElement("span");
    const categoryLabel = document.createElement("span");
    categoryLabel.className = "category-label";
    categoryLabel.textContent = note.category;
    const createdAt = document.createElement("time");
    createdAt.textContent = note.createdAt;
    noteDetails.append(categoryLabel, " · ", createdAt);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      notes = notes.filter((item) => item.id !== note.id);
      saveNotes();
      renderNotes();
    });

    noteMeta.append(noteDetails, deleteButton);
    noteCard.append(noteText, noteMeta);
    notesList.append(noteCard);
  }
}

function getNoteCountMessage(count) {
  if (count === 0) {
    return "You have no notes yet.";
  }

  if (count === 1) {
    return "You have 1 note.";
  }

  return `You have ${count} notes.`;
}

function loadNotes() {
  try {
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes === null) {
      return [];
    }

    const parsedNotes = JSON.parse(savedNotes);
    if (!Array.isArray(parsedNotes) || !parsedNotes.every(isNote)) {
      throw new Error("Saved notes have an invalid format.");
    }

    return parsedNotes;
  } catch (error) {
    console.error("Unable to load saved notes.", error);
    errorMessage.textContent = "Saved notes could not be loaded.";
    return [];
  }
}

function isNote(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    value.text.length > 0 &&
    value.text.length <= 200 &&
    categories.has(value.category) &&
    typeof value.createdAt === "string"
  );
}

function saveNotes() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(notes));
  } catch (error) {
    console.error("Unable to save notes.", error);
    errorMessage.textContent = "Your notes could not be saved in this browser.";
  }
}

renderNotes();
