# Database Relations Map

This file maps the Prisma models and their relationships.

---

## App Models

Models/tables created manually for the e-commerce domain.

App
|-- Movie
| |-- MovieGenre[]    // junction rows that connect movie to genres
| |-- MovieCast[]     // junction rows that connect movie to actors (Person)
| |-- MovieDirector[] // junction rows that connect movie to directors (Person)
| |-- OrderItem[]     // movie can appear in many purchased line items
| `-- CartItem[]      // movie can appear in many in-progress cart line items
|
|-- Genre
|   `-- MovieGenre[] // many-to-many link to movies
|
|-- Person
| |-- MovieCast[]      // person appears as actor in many movies
| `-- MovieDirector[]  // person appears as director in many movies
|
|-- Cart
|   |-- User       // each cart belongs to exactly one user
|   `-- CartItem[] // one cart has many line items
|
|-- CartItem
| |-- Cart     // each cart line item belongs to one cart
| `-- Movie    // each cart line item references one movie with quantity
|
|-- Order
|   |-- User        // each order belongs to exactly one user (Better Auth User)
|   `-- OrderItem[] // one order has many line items
|
|-- OrderItem
| |-- Order  // each order line item belongs to one order
| `-- Movie  // each order line item references one movie and stores unit purchase price
|
|-- MovieGenre (junction)
|   |-- Movie   // side A of movie <-> genre
|   `-- Genre   // side B of movie <-> genre
|
|-- MovieCast (junction)
| |-- Movie     // side A of movie <-> actor/person
| `-- Person    // side B
|
`-- MovieDirector (junction)
|-- Movie   // side A of movie <-> director/person
`-- Person  // side B

---

## Better Auth Models

These models are generated and managed by Better Auth. Do not edit manually.

Better Auth
|-- User
| |-- Session[] // one user has many active sessions
| |-- Account[] // one user can have many provider accounts (e.g. OAuth)
| |-- Order[] // one user can place many orders (link to app domain)
| `-- Cart?            // one user can have zero-or-one active cart
|
|-- Session
|   `-- User // auth session belongs to one user
|
|-- Account
| `-- User             // provider account belongs to one user
|
`-- Verification
`-- (no FK relation) // standalone records for email/token verification flows

---

## Cardinality Summary

### App models

- Movie many <-> many Genre via MovieGenre
- Movie many <-> many Person (actor role) via MovieCast
- Movie many <-> many Person (director role) via MovieDirector
- Cart 1 -> many CartItem
- Cart N -> 1 User
- Movie 1 -> many CartItem
- Order 1 -> many OrderItem
- Order N -> 1 User
- Movie 1 -> many OrderItem

### Better Auth models

- User 1 -> many Session
- User 1 -> many Account
- User 1 -> many Order
- User 0..1 -> 1 Cart

---

## Notes

- Person is shared by actor and director links, so one person can hold both roles.
- Junction tables are explicit for structured data storage.
- CartItem enforces one row per movie in a cart via @@unique([cartId, movieId]); quantity stores copies.
- OrderItem enforces one row per movie in an order via @@unique([orderId, movieId]); quantity stores copies.
- OrderItem.unitPriceAtPurchase stores unit price at checkout; line total is quantity \* unitPriceAtPurchase.
- Order.userId references the Better Auth User.id, linking the e-commerce domain to auth.
