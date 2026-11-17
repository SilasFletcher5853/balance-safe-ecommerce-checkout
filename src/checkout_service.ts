import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const checkoutRequestSchema = z.object({
  order_id: z.string().min(1),
  customer_email: z.string().email(),
  order_total_usd: z.number().positive(),
  reserve_usd: z.number().nonnegative()
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type CheckoutDecision = "accepted" | "pending_recharge";

export function decideCheckout(balanceUsd: number, order: Pick<CheckoutRequest, "order_total_usd" | "reserve_usd">): CheckoutDecision {
  return balanceUsd >= order.order_total_usd + order.reserve_usd ? "accepted" : "pending_recharge";
}

export async function checkout(raw: unknown, client: InfraiClient) {
  const order = checkoutRequestSchema.parse(raw);
  const { balance_usd: balanceUsd } = await client.balance();
  const decision = decideCheckout(balanceUsd, order);
  if (decision === "pending_recharge") {
    await client.configureAutoRecharge({ trigger_balance: order.order_total_usd + order.reserve_usd, recharge_amount: order.order_total_usd + order.reserve_usd });
  }
  const email = await client.sendEmail({
    to: order.customer_email,
    subject: `Order ${order.order_id} update`,
    body: decision === "accepted" ? `Order ${order.order_id} is accepted for fulfillment.` : `Order ${order.order_id} is waiting for account recharge.`
  });
  return { order_id: order.order_id, decision, message_id: email.message_id };
}
