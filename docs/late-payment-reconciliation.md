# Late-payment evidence and manual reconciliation

When Paystack confirms a payment **after** its order was cancelled or its
30-minute reservation expired, the order is intentionally **not** marked
paid. Instead the verified transaction is appended to the order's
`latePayments[]` array (`function/models/Order.js`) by `recordLatePayment()`
(`function/services/orderService.js`), recording reference, amount (kobo),
channel, Paystack timestamp, receipt timestamp, and source
(`callback` / `webhook`).

## Reconciling

1. Find the order by ID (admin order view shows late payments, deduplicated
   by reference, with a "manual review required" flag).
2. Match each `latePayments[].reference` and amount against the Paystack
   dashboard.
3. Resolve manually (fulfil, refund via Paystack, or contact the customer).
   The application never refunds automatically and customer emails never
   promise refunds. `status` and `paymentStatus` are never mutated by this
   path, and buyers never see these entries on the tracking page.

## Known limitations (do not assume otherwise)

* **No database-enforced exactly-once recording.** Duplicates are prevented
  by one atomic `findOneAndUpdate` (`latePayments.reference: {$ne}` +
  `$push`), which is airtight for sequential redelivery but cannot serialize
  truly simultaneous writers. A simultaneous collision would leave two rows
  with the same reference — benign: dedupe by reference when reconciling.
* **Live MongoDB concurrency has not been tested.** Race coverage is mocked
  (`payment-cancel-race-test.js`) plus static filter assertions. The
  configured production cluster must not be used for testing.
* **Retries are finite.** A webhook whose evidence write fails gets HTTP 503
  (never a false 200) so Paystack retries, and callback + webhook provide
  two independent recording attempts — but Paystack does not retry forever.
  Unrecorded cases surface as error logs; treat repeated 503s as an incident.
