# AI Generated Test Scenarios

## Prompt Used

Suggest 10 Playwright test scenarios for https://storedemo.testdino.com covering ecommerce edge cases, cart behavior, UI validation, and checkout flow.

## Raw AI Output

 Based on an exploration of the Storedemo website (https://storedemo.testdino.com) and the existing test suite, here are 10 recommended Playwright test scenarios.
  These cover critical ecommerce paths, UI resilience, and common edge cases.

  🛒 Cart & Inventory Behavior
   1. Dynamic Quantity Updates & Price Calculation
      - Scenario: Add a product to the cart, increase the quantity to 5, then decrease it to 2.
      - Verification: Ensure the line-item total and the cart subtotal update dynamically. Verify that the cart badge reflects the total units correctly.

   2. Cart Persistence Across Sessions
      - Scenario: Add 3 items to the cart and refresh the browser or navigate to an external site and back.
      - Verification: Ensure the items remain in the cart (validating localStorage or sessionStorage persistence).

   3. Empty State & Recovery
      - Scenario: Navigate to an empty cart or remove all items from a populated cart.
      - Verification: Verify the "Your cart is empty" message appears and the "Continue Shopping" button correctly redirects the user back to the product catalog.

  💳 Checkout Flow & Logic
   4. Mandatory Field Validation in Checkout
      - Scenario: Proceed to the checkout screen and attempt to submit the shipping/billing form with empty mandatory fields (e.g., Email, Zip Code).
      - Verification: Assert that specific error messages appear and that the user is prevented from moving to the next step.

   5. Guest vs. Authenticated Redirection
      - Scenario: Click "Checkout" as a non-logged-in user.
      - Verification: Ensure the application redirects to the Login/Register page and offers a clear path for "Guest Checkout."

   6. Discount/Coupon Code Logic
      - Scenario: Apply a valid coupon code (e.g., SAVE10) and an invalid one.
      - Verification: Verify the discount is applied to the total for valid codes and that a "Code Invalid" error appears for fake ones.

  🔍 Search & UI Validation
   7. Search Relevance & "No Results" State
      - Scenario: Search for a specific product name (e.g., "JBL") and then search for a random string (e.g., "qwerty12345").
      - Verification: Confirm that "JBL" returns relevant results and the random string displays a "No products found" UI.

   8. Responsive Layout Verification (Mobile Emulation)
      - Scenario: Emulate a mobile viewport (e.g., iPhone 13).
      - Verification: Verify the navigation menu collapses into a hamburger icon and the product grid switches from multiple columns to a single-column layout.

  🛠️ Edge Cases & Reliability
   9. API Error Resilience (Mocking)
      - Scenario: Use page.route to intercept the "Add to Cart" API call and return a 500 Internal Server Error.
      - Verification: Ensure the UI doesn't crash and instead displays a graceful error toast to the user.

   10. Race Condition: Double-Click "Add to Cart"
       - Scenario: Rapidly click the "Add to Cart" button multiple times.
       - Verification: Ensure the application handles the requests sequentially or debounces the input, preventing duplicate items from being added unexpectedly.
