const noteForm = document.querySelector("#note-form");
const noteInput = document.querySelector("#note-input");
const categorySelect = document.querySelector("#category-select");
const notesList = document.querySelector("#notes-list");

let notes = [];

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const note = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: noteInput.value,
    category: categorySelect.value,
    createdAt: new Date().toLocaleString(),
  };

  notes.push(note);
  noteInput.value = "";
  renderNotes();
});

function renderNotes() {
  notesList.replaceChildren();

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

    noteMeta.append(noteDetails, deleteButton);
    noteCard.append(noteText, noteMeta);
    notesList.append(noteCard);
  }
}
