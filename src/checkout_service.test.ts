import test from "node:test";
import assert from "node:assert/strict";
import { decideCheckout } from "./checkout_service.ts";

test("accepts an order when balance covers total and reserve", () => {
  assert.equal(decideCheckout(100, { order_total_usd: 80, reserve_usd: 20 }), "accepted");
  assert.equal(decideCheckout(99, { order_total_usd: 80, reserve_usd: 20 }), "pending_recharge");
});
