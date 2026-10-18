# QuickNotes System Design

QuickNotes is a small browser client for creating, loading, and deleting notes, accompanied by backend API, data-model, and architecture designs for a production note-taking service. The client uses JSONPlaceholder to demonstrate HTTP requests; it does not connect to the production API described in the design documents.

## Run the API client

1. Open this repository folder in Visual Studio Code.
2. Serve `index.html` over localhost with the Live Server extension (or another static HTTP server).
3. In the browser, select **Load notes** to fetch ten sample posts, or use the form to create a note and its **Delete** button to remove one.

The page has no build step or package installation. JSONPlaceholder simulates successful POST and DELETE requests without persisting those changes; created/deleted notes are updated in the current page view only and a page reload restores the server's sample data.

## Design documents

- [API design](docs/api-design.md) — production REST endpoints, examples, and error responses.
- [Data model](docs/data-model.md) — PostgreSQL entities, relationships, SQL schema, indexes, and queries.
- [Architecture](docs/architecture.md) — requirements, scale estimates, system diagram, request flows, and trade-offs.

## What I learned

- Read-heavy services can use caches and read replicas to reduce pressure on the primary database, while still routing consistency-sensitive reads to the primary.
- Separating user-facing writes from asynchronous work with a durable queue can improve response time, but requires idempotent workers, retry policies, and a plan for eventual consistency.
- Relational foreign keys and a junction table enforce ownership and many-to-many relationships, and indexes should match frequent filters and sort orders.
- A browser client should treat API data as untrusted text, validate user input, expose loading and failure states, and disable controls while requests are in progress.
