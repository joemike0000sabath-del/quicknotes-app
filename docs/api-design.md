# QuickNotes REST API Design

This document describes the production QuickNotes API, not the JSONPlaceholder service used by the browser exercise. The API is versioned under `/v1`, uses JSON request and response bodies, and authenticates private routes with a bearer access token.

## Endpoints

| Method | Path | Description | Success status |
| --- | --- | --- | --- |
| `POST` | `/v1/users` | Register a user account. | `201 Created` |
| `POST` | `/v1/sessions` | Authenticate credentials and issue an access token. | `201 Created` |
| `GET` | `/v1/notes` | List the authenticated user's notes, newest updated first; supports `limit` and `cursor` pagination. | `200 OK` |
| `POST` | `/v1/notes` | Create a note owned by the authenticated user. | `201 Created` |
| `GET` | `/v1/notes/{noteId}` | Retrieve one of the authenticated user's notes. | `200 OK` |
| `PATCH` | `/v1/notes/{noteId}` | Update a note's title or body. | `200 OK` |
| `DELETE` | `/v1/notes/{noteId}` | Delete a note and its tag associations. | `204 No Content` |
| `GET` | `/v1/tags` | List the authenticated user's tags. | `200 OK` |
| `PUT` | `/v1/notes/{noteId}/tags/{tagId}` | Associate an owned tag with an owned note; idempotent. | `204 No Content` |

All note and tag routes require authentication. User-owned resources are scoped to the authenticated user, so a client cannot access another user's notes by changing an ID.

## Create a note

Request:

```http
POST /v1/notes
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "title": "Meeting notes",
  "body": "Follow up with the design team."
}
```

Response (`201 Created`):

```json
{
  "id": "note_01JAZ8G4K1Q9",
  "title": "Meeting notes",
  "body": "Follow up with the design team.",
  "createdAt": "2026-10-18T15:30:00Z",
  "updatedAt": "2026-10-18T15:30:00Z",
  "tags": []
}
```

The server determines the owner from the access token; clients cannot supply or override `userId`.

## List notes

Request:

```http
GET /v1/notes?limit=2
Authorization: Bearer <access-token>
```

Response (`200 OK`):

```json
{
  "items": [
    {
      "id": "note_01JAZ8G4K1Q9",
      "title": "Meeting notes",
      "body": "Follow up with the design team.",
      "createdAt": "2026-10-18T15:30:00Z",
      "updatedAt": "2026-10-18T15:30:00Z",
      "tags": []
    },
    {
      "id": "note_01JAZ7Y2A5MR",
      "title": "Reading list",
      "body": "Read the new system design chapter.",
      "createdAt": "2026-10-17T09:00:00Z",
      "updatedAt": "2026-10-17T09:00:00Z",
      "tags": ["personal"]
    }
  ],
  "nextCursor": "eyJ1cGRhdGVkQXQiOiIyMDI2LTEwLTE3VDA5OjAwOjAwWiJ9"
}
```

An empty collection returns `200 OK`, `"items": []`, and `"nextCursor": null`.

## Error statuses and response

| Status | Meaning | Example use |
| --- | --- | --- |
| `400 Bad Request` | Malformed JSON, invalid query parameter, or structurally invalid request. | A non-numeric `limit`. |
| `401 Unauthorized` | Missing, expired, or invalid access token. | An unauthenticated private-route request. |
| `403 Forbidden` | Authenticated user is not allowed to perform the operation. | Attempt to access a resource outside the user's scope. |
| `404 Not Found` | Resource does not exist or is not visible to this user. | Unknown note ID. |
| `409 Conflict` | Request conflicts with current resource state. | Duplicate email during registration. |
| `422 Unprocessable Entity` | Request fields fail business validation. | A missing or overlong note title. |
| `429 Too Many Requests` | Rate limit exceeded. | Too many create requests in a short window. |
| `500 Internal Server Error` | Unexpected server-side failure. | Unhandled persistence or service failure. |

Example `422 Unprocessable Entity` body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "title",
        "message": "Title is required and must be at most 100 characters."
      }
    ],
    "requestId": "req_01JAZ9N8TZ6B"
  }
}
```

Error responses use the same envelope; server responses should not expose stack traces or internal database details.
