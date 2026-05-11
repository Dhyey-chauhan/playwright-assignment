# Playwright QA Assignment

This repository contains my solution for the Playwright QA Engineer assignment using the demo ecommerce application:

https://storedemo.testdino.com/

## Tech Stack

- Playwright Test
- TypeScript
- Node.js

---

# Part 1 — Implemented Scenarios

I implemented the following scenarios from the assignment:

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

# Test Scenarios

## 1. Add to Cart Flow

This test verifies that multiple products can be added successfully and the cart badge updates correctly.

### What the test does
- Opens the store homepage
- Adds 3 different products
- Verifies the cart count becomes 3
- Captures a screenshot of the final cart state

### Notes
The test was written using Playwright locators and assertions to avoid hardcoded waits and improve stability.

---

## 2. Cross-context Isolation

This test checks whether cart data remains isolated across separate browser contexts.

### What the test does
- Creates two independent browser contexts
- User A adds a product to the cart
- User B opens the site separately
- Verifies User B cart remains empty

### Observation
Browser contexts in Playwright correctly isolate session storage, cookies, and local state.

---

## 3. Network-driven State Coverage

This test uses `page.route()` to simulate different backend responses without modifying the actual server.

### Covered States
- Empty catalog
- Server error (500)
- Slow network delay

### What was verified
- Application behavior under different API conditions
- UI stability during delayed responses
- State screenshots for debugging and validation

---

# Screenshots

The following screenshots are generated during execution:

```bash
screenshots/
├── cart-with-3-products.png
├── product-page.png
├── empty-catalog.png
├── server-error.png
└── slow-network.png
```

---

# AI Usage

AI assistance was used mainly for:
- Understanding Playwright best practices
- Improving test structure
- Refining README formatting

The final implementation, debugging, and execution were completed manually.

---

# Challenges Faced

- Finding stable locators for cart verification
- Handling asynchronous UI updates after cart actions
- Simulating backend states reliably using route interception

---

# Author

Dhyey Chauhan
