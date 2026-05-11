# Playwright QA Assignment

This repository contains my solution for the Playwright QA Engineer assignment using the demo ecommerce application:

https://storedemo.testdino.com/

## Tech Stack

- Playwright Test
- TypeScript
- Node.js

---

# Part 1 — Implemented Scenarios

Implemented scenarios:

1. Add 3 products to cart and verify cart count
2. Cross-context cart isolation
3. Network-driven state coverage using route mocking

---

# Project Structure

```bash
tests/
├── add-to-cart.spec.ts
├── cross-context.spec.ts
└── network-states.spec.ts
```

---

# Scenario 1 — Add 3 Products to Cart

## Objective

Verify that multiple products can be added successfully and the cart badge reflects the correct item count.

## Approach

- Created a reusable product list array
- Navigated to each product page individually
- Used Playwright text locators to select products
- Verified the Add to Cart button before interaction
- Added products sequentially to avoid flaky behavior
- Verified the cart badge updates to `3`
- Captured the final cart state screenshot

## Why This Approach

Instead of using static waits, the test relies on Playwright assertions and built-in waiting behavior to make the flow more stable and predictable.

---

# Scenario 2 — Cross-context Isolation

## Objective

Verify that cart state remains isolated between different browser contexts.

## Approach

- Launched two independent browser contexts:
  - User A
  - User B
- User A added a product to the cart
- User B opened the application separately without shared session state
- Verified that User B cart remained empty

## Why This Approach

Browser contexts in Playwright simulate separate users by isolating cookies, local storage, and session data. This makes it useful for testing user/session separation scenarios.

---

# Scenario 3 — Network-driven State Coverage

## Objective

Test how the frontend behaves under different backend/API conditions.

## Approach

Used `page.route()` to intercept product API requests and simulate multiple backend states without modifying the actual backend.

### Covered Cases

#### Empty Catalog
Returned an empty product array to verify how the UI behaves when no products are available.

#### Server Error (500)
Mocked a server failure response to observe frontend handling during API failure conditions.

#### Slow Network Delay
Introduced an artificial delay before continuing the API request to simulate slower network conditions.

## Why This Approach

Route interception allows frontend behavior to be tested independently from backend implementation and helps validate edge-case handling more reliably.

---

# Screenshots

Generated during execution:

```bash
screenshots/
├── cart-with-3-products.png
├── empty-catalog.png
├── server-error.png
└── slow-network.png
```

---

# AI Usage

AI assistance was used for:
- Understanding Playwright best practices
- Improving code structure
- Refining README formatting

The implementation, execution, debugging, and test validation were completed manually.

---

# Challenges Faced

- Done something manually cause it is detecting as an bot and showing the blank page.
- Finding stable locators for cart verification
- Avoiding flaky waits during navigation and UI updates
- Simulating backend states reliably using route interception

# Author

Dhyey Chauhan
