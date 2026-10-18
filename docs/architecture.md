# QuickNotes System Architecture

## Requirements

### Functional requirements

- Users can register and sign in securely.
- Authenticated users can create, read, update, and delete their own notes.
- Users can create tags and associate them with notes.
- Users can browse notes in update order and search/filter by tag.
- The service validates input and returns consistent success and error responses.

### Non-functional requirements

- Keep note data private and available only to its owner.
- Remain responsive during expected traffic peaks and scale horizontally as usage grows.
- Persist acknowledged writes durably and recover from a server or availability-zone failure.
- Maintain useful availability, observability, and backup/restore procedures.
- Protect credentials and data in transit and at rest, and rate-limit abusive traffic.

## Load estimate for 1 million registered users

Assume 10% of registered users are active each day, each daily active user reads 50 note/feed pages and writes one note per day, activity is evenly distributed over 86,400 seconds, and each stored note consumes 1 KB including its row metadata. Use decimal storage units and retain all new notes for one year; this estimate excludes user records, indexes, replicas, backups, and overhead.

- Daily active users: `1,000,000 × 10% = 100,000`.
- Reads per day: `100,000 × 50 = 5,000,000`; average reads per second: `5,000,000 ÷ 86,400 = 57.9`, or about 58 reads/second.
- Writes per day: `100,000 × 1 = 100,000`; average writes per second: `100,000 ÷ 86,400 = 1.16`, or about 1.2 writes/second.
- One-year note storage: `100,000 × 365 × 1 KB = 36,500,000 KB`, or about 36.5 GB per year.
- For an initial capacity target, a 5× traffic burst is about 290 reads/second and 5.8 writes/second; this is a planning factor, not an additional user assumption.

## Architecture diagram

```text
                               +----------------------+
                               |      DNS service     |
                               +----------+-----------+
                                          |
                                          v
+------------+      +--------------------+------------------+
| Web client | ---> | CDN: static app assets / cache policy |
+------------+      +--------------------+------------------+
                                          |
                                          v
                               +----------------------+
                               |   Load balancer      |
                               +----------+-----------+
                                          |
                         +----------------+----------------+
                         |                                 |
                         v                                 v
                +------------------+              +------------------+
                | App server A     |              | App server B     |
                +--------+---------+              +---------+--------+
                         |                                  |
           +-------------+------------------+---------------+
           |                                |               |
           v                                v               v
    +-------------+                 +--------------+  +----------+
    | Cache       |                 | Primary DB   |  | Queue    |
    +-------------+                 +------+-------+  +----+-----+
                                           |               |
                                     replication           v
                                           |       +---------------+
                                           v       | Worker pool   |
                                    +--------------+ +------+------+
                                    | Read replica |        |
                                    +--------------+        +--> cache invalidation,
                                                                search indexing and
                                                                notifications
```

Private note responses are not placed in a shared CDN cache; the CDN serves the static client and may cache only explicitly public, versioned assets. The primary database is authoritative for writes, while the read replica serves eligible reads.

## Components

- **Web client:** Provides the note interface and sends authenticated API requests without holding persistence responsibilities.
- **DNS service:** Resolves the service hostname and directs clients to the globally reachable edge endpoint.
- **CDN:** Serves static application assets near users, reducing page-load latency and origin traffic.
- **Load balancer:** Health-checks app instances and distributes API requests so one server does not become a traffic bottleneck.
- **App servers (A and B):** Validate and authorize requests and run the API as stateless instances that can scale horizontally.
- **Cache:** Holds frequently requested note lists and session-related data to reduce database read load, with ownership-aware keys.
- **Primary database:** Durably stores users, notes, tags, and associations and accepts transactional writes.
- **Read replica:** Serves suitable read queries to increase read capacity without sending every query to the write primary.
- **Queue:** Buffers asynchronous work so indexing, cache invalidation, and notifications do not extend the user's API request.
- **Worker pool:** Retries and processes queued jobs independently of web servers, such as refreshing search indexes and sending notifications.

## GET `/v1/notes` flow

1. The client resolves the API hostname through DNS and sends an authenticated `GET /v1/notes` request over HTTPS.
2. The CDN forwards the private API request without serving a shared cached response; the load balancer chooses a healthy app server.
3. The app server validates the access token and extracts the user's identity and pagination parameters.
4. The app server checks the cache using a key scoped to that user and query; on a cache miss, it queries the read replica for the user's notes.
5. The app server serializes the authorized result and cursor into a `200 OK` response and optionally stores the result in the cache with a short expiration.

## POST `/v1/notes` flow

1. The client sends an authenticated `POST /v1/notes` request with a title and optional body through DNS, CDN, and load balancer to a healthy app server.
2. The app server validates the token and request fields, then inserts the note on the primary database in a transaction.
3. After the primary confirms the write, the app server enqueues follow-up work for cache invalidation and search indexing; queue failures are surfaced or retried rather than changing a successful database write into a silent success.
4. The app server returns `201 Created` and the new note representation; the worker later processes the queued job and safely retries transient failures.
5. A subsequent read may use the primary briefly for read-after-write consistency, or wait for the replica and cache to catch up.

## Trade-offs and failure handling

- **Caching vs. freshness:** Cache hits reduce latency and database load, but note edits can briefly leave stale feed results; use short TTLs, ownership-scoped keys, and queued invalidation, and route a just-written note's immediate read to the primary when required.
- **Read replicas vs. immediate consistency:** Replicas increase read capacity, but asynchronous replication can lag; use the primary for consistency-sensitive reads and monitor replication delay.
- **Asynchronous worker jobs vs. immediate side effects:** Queues keep API responses fast and absorb bursts, but indexing and notifications are eventually consistent; use durable jobs, idempotent workers, bounded retries, and a dead-letter queue.
- **Redundancy vs. operating cost:** Multiple zones, database failover, and replicated queue/cache tiers improve availability but cost more and increase operational complexity.

There is no intentional single point of failure: run DNS/CDN and load-balancer services redundantly, place at least two stateless app servers across availability zones, use a highly available cache and durable replicated queue, and configure the database with automated primary failover to a replica plus tested backups. Health checks remove failed instances from service, and monitoring and failover drills verify recovery rather than assuming redundancy alone is sufficient.
