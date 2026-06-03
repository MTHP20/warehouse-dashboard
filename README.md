# Warehouse Product Monitoring Dashboard

A real-time product monitoring dashboard built with Angular V20. Product items are displayed with live stock level updates, reactive filtering and sorting, and a persistent notification bar that alerts on stock statys changes. This is build using modern Angular standalone components, signals, updated control flow syntax, and RxJS. In additon, Vitest was used for unit testing.

---

## Getting Started

**Prerequisites**

- Node 22+
- Angular CLI 20 (`npm install -g @angular/cli`)

**Install and run**

```bash
npm install
npm run start
```

The app will be available at `http://localhost:4200`.

**Run tests**

```bash
npm run test
or
npx vitest
```

---

## What's Implemented

- **Product List** — live stock updates via RxJS interval; reactive category and status filters; sort ascending/descending by stock level; click through to detail view
- **Product Detail** — loads product and order history by route ID; updates on route change without a full page reload; loading, error, and data states all handled with user-visible feedback and a retry option
- **Notification Bar** — persistent alert bar reacting to Low Stock / Out of Stock transitions; state via shared signal service; no component inputs or outputs; web component ready
- **ProductService** — simulated API with delays; `retry()` + `catchError()`; in-memory Map cache for product data; `shareReplay(1)` on the live stream; business logic kept separate from data fetching
- **Signals** — `signal()`, `computed()`, and `effect()` used throughout Product Detail and Notification Bar for local state and derived values
- **Unit tests with Vitest** — coverage across Product List, Product Detail, Notification Bar, and ProductService; edge cases include empty list, API failure, and stock status transitions

---

## Notification Bar as a Web Component

The `NotificationBarComponent` is structured to work as an Angular Element outside of an Angular application:

- `ViewEncapsulation.ShadowDom` provides full style isolation from the host page
- No `@Input` or `@Output` bindings as all state flows are through the injected `NotificationService`
- The component reads `notificationsService.currentAlert` directly as a signal therefore the template updates reactively without any subscription management involved.
- An `effect()` in the constructor handles side effects triggered by alert changes

The `createCustomElement` registration and `customElements.define` call are not wired into the build yet, but the component is ready for it.

---

## Known Limitations / What I'd Do Next

**Web component build step not wired up.** The next step would be installing `@angular/elements`, registering the component in `main.ts`, and adding a `npm run build:elements` script producing a self-contained bundle for use outside the Angular project.

**Retry logic has no backoff.** The current `retry({ count: 3 })` retries immediately. In production this should use exponential backoff such as `retry({ count: 3, delay: (_, attempt) => timer(Math.pow(2, attempt) * 500) })` as this avoids hammering a struggling API.

**Rapid route change edge cases.** `switchMap` handles cancellation correctly but under very rapid navigation I'd implement a `distinctUntilChanged()` on the route param and stress-test the `takeUntilDestroyed` cleanup timing more thoroughly.

**Feature / Design UI.** After implementing the full structure of the Warehouse Dashboard, I wanted to quickly implement a cleaner UI layout. Although the "prettiness" is not taken into account, I do think it's very crucial how we display our data, both for easier readability as well as usability. Given more time this would have also been a priority.

---

## Git History

Development was organised using feature branches where each branch scoped to a single area of the application (e.g. `feature/product-list`, `feature/notifications`, `feature/testing`) and merged into `main` when complete. Commit messages are clear and descriptive, with the purpose of each change easy to follow.
