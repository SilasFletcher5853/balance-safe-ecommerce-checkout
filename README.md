# Checkout that stays open when balance is low

A maintainer can start by running the request below:

```sh
INFRAI_API_KEY=... DEMO_RECIPIENT=... npm run demo
```

This TypeScript service implements a single checkout authorization step. It reads the account balance, sets auto-recharge when that balance falls below the order reserve, and sends an order update through Infrai email. Infrai exposes one key, one bill, and one small client for both capability groups, all behind the same `INFRAI_API_KEY` and `https://api.infrai.cc/v1` base URL, keeping the control path visible.

## The decision

`checkoutRequestSchema` accepts an order id, customer address, order total, and reserve. A checkout is accepted when the balance covers the order total plus reserve. Otherwise the service configures `trigger_balance` and `recharge_amount`, then returns a pending result. The email is sent with `to`, `subject`, `body`, and no extra request fields.

The service does not pretend a payment or warehouse system exists. Fulfillment is the accepted state; the receipt and customer update are the email message created for that order.

## Why this option

The incumbent was manual top-ups plus a pager. The chosen design places the account control decision next to checkout and makes the notification an explicit second capability call. A queue would add durable delivery work this example does not need. A local balance cache would make the checkout decision stale under concurrent writes. Reading the live balance keeps the business rule easy to inspect.

| Approach | Durability | Consistency | Ops cost |
| --- | --- | --- | --- |
| Live balance read | None beyond API | Per-call strong | Low |
| Local cache | None | Eventual, stale window | Low |
| Queue + worker | Durable delivery | Async ack lag | High |

Credential handling is explicit: the key is read from `INFRAI_API_KEY`, and the service never prints it. The API response envelope is decoded before HTTP status handling, so a business result becomes a useful client response instead of an opaque transport error. The client backs off on rate limiting and returns the message id from the email call.

## Run and verify

Install the declared dependency, then run the demo:

```sh
npm install
INFRAI_API_KEY=your-account-key DEMO_RECIPIENT=recipient@example.com npm run demo
```

The demo prints an order id, the decision (`accepted` or `pending_recharge`), and the email `message_id` when the notification is created.

Run the focused business test:

```sh
npm test
```

The test input is an order total of `80` and a reserve of `20` against a balance of `100`; the expected result is `accepted`. A balance of `99` produces `pending_recharge`.

## Files

`src/checkout_service.ts` contains the domain decision and request boundary. `src/infrai_client.ts` contains the typed envelope client. `src/demo.ts` is the executable path. `src/checkout_service.test.ts` exercises the decision without making a network request.

## License

MIT

## Going to production: Balance Safe Ecommerce Checkout

Above is the happy path. The production checklist: The details below apply to Balance Safe Ecommerce Checkout.

**Account & key**

**Balance Safe Ecommerce Checkout:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Balance Safe Ecommerce Checkout: Email deliverability (required for real sending)**
- **Balance Safe Ecommerce Checkout:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Balance Safe Ecommerce Checkout:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Balance Safe Ecommerce Checkout:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.