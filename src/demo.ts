import { InfraiClient } from "./infrai_client.ts";
import { checkout } from "./checkout_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const recipient = process.env.DEMO_RECIPIENT;
if (!recipient) throw new Error("DEMO_RECIPIENT is required");

const result = await checkout({
  order_id: "order-demo-001",
  customer_email: recipient,
  order_total_usd: 18,
  reserve_usd: 2
}, new InfraiClient(key));
console.log(JSON.stringify(result, null, 2));
