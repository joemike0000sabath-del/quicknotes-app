const noteForm = document.querySelector("#note-form");
const noteInput = document.querySelector("#note-input");
const categorySelect = document.querySelector("#category-select");
const notesList = document.querySelector("#notes-list");
const errorMessage = document.querySelector("#error-message");
const noteCount = document.querySelector("#note-count");

let notes = [];

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
  renderNotes();
});

function renderNotes() {
  notesList.replaceChildren();
  noteCount.textContent = getNoteCountMessage(notes.length);

  for (const note of notes) {
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

renderNotes();
