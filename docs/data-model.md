# QuickNotes Data Model

QuickNotes uses PostgreSQL. Note content and relationships are structured and transactionally updated, and relational constraints make ownership and tag associations reliable. PostgreSQL provides indexes and read replicas for scaling reads while retaining referential integrity.

## Entities and relationships

| Entity | Columns and types | Primary key | Foreign keys |
| --- | --- | --- | --- |
| `users` | `id BIGINT`, `email VARCHAR(320)`, `password_hash TEXT`, `created_at TIMESTAMPTZ` | `id` | None |
| `notes` | `id BIGINT`, `user_id BIGINT`, `title VARCHAR(100)`, `body TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ` | `id` | `user_id` references `users(id)` |
| `tags` | `id BIGINT`, `user_id BIGINT`, `name VARCHAR(50)`, `created_at TIMESTAMPTZ` | `id` | `user_id` references `users(id)` |
| `note_tags` | `note_id BIGINT`, `tag_id BIGINT`, `user_id BIGINT`, `added_at TIMESTAMPTZ` | `(note_id, tag_id)` | `(note_id, user_id)` references `notes(id, user_id)`; `(tag_id, user_id)` references `tags(id, user_id)` |

One user can own many notes and many tags, so users-to-notes and users-to-tags are one-to-many relationships. A note can have many tags and a tag can label many notes, so notes-to-tags is many-to-many through `note_tags`; its composite foreign keys ensure that a user cannot associate another user's note and tag.

## PostgreSQL schema

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id)
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name),
    UNIQUE (id, user_id)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id, user_id)
        REFERENCES notes(id, user_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id, user_id)
        REFERENCES tags(id, user_id) ON DELETE CASCADE
);

CREATE INDEX notes_user_updated_idx
    ON notes (user_id, updated_at DESC);
```

The `notes_user_updated_idx` index makes the common query for one user's most recently updated notes efficient, including its ownership filter and sort order. The unique indexes on `users.email` and `(tags.user_id, tags.name)` also enforce uniqueness and support lookup.

## Example queries

List one user's notes, newest updated first, with keyset pagination:

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = $1
  AND ($2::timestamptz IS NULL OR updated_at < $2)
ORDER BY updated_at DESC
LIMIT $3;
```

Find all tags attached to a specific note (JOIN):

```sql
SELECT t.id, t.name
FROM note_tags AS nt
JOIN tags AS t
  ON t.id = nt.tag_id
 AND t.user_id = nt.user_id
WHERE nt.note_id = $1
  AND nt.user_id = $2
ORDER BY t.name;
```

Count notes per user:

```sql
SELECT u.id, u.email, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.email
ORDER BY note_count DESC;
```

Create a note for the authenticated user:

```sql
INSERT INTO notes (user_id, title, body)
VALUES ($1, $2, $3)
RETURNING id, title, body, created_at, updated_at;
```
