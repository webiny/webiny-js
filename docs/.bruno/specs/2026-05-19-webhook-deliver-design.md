# WebhookDeliver Abstraction Design

Extract the inline `fetch` call in `SendWebhookTask` into a dedicated `WebhookDeliver` abstraction with configurable retry, exponential backoff, and 429/5xx awareness.

## Scope

A single abstraction that owns the HTTP POST to a webhook endpoint. It accepts a fully-prepared request (URL, headers, body) and returns the outcome. The caller (`SendWebhookTask`) remains responsible for payload construction, signing, and delivery status persistence.

## Interface

```typescript
interface IWebhookDeliverInput {
    url: string;
    headers: Record<string, string>;
    body: string;
    timeout: number;        // per-attempt timeout in ms
    maxRetries: number;     // 0 = no retries (single attempt)
    initialDelay: number;   // first retry delay in ms
    maxDelay: number;       // ceiling for exponential growth in ms
}

interface IWebhookDeliverResult {
    status: number;         // HTTP status code; 0 on network failure
    body: string;           // response body text or error message
    responseTime: number;   // total wall-clock time in ms (all attempts + delays)
    attempts: number;       // total attempts made (1 = no retries fired)
}

interface IWebhookDeliver {
    execute(input: IWebhookDeliverInput): Promise<IWebhookDeliverResult>;
}
```

## Retry Behaviour

### Retryable conditions

A response is retryable when any of the following is true:

1. **Network error** — `fetch` throws (timeout, DNS failure, connection refused, socket hang-up).
2. **Server error** — HTTP status 500-599.
3. **Rate limited** — HTTP status 429.

All other responses (1xx, 2xx, 3xx, 4xx except 429) are terminal — returned immediately, no retry.

### Backoff strategy

Exponential backoff: `delay = min(initialDelay * 2^attempt, maxDelay)`.

- `attempt` is zero-indexed (first retry uses `initialDelay * 2^0 = initialDelay`).
- On a 429 with a `Retry-After` header: use `max(parsedRetryAfter, computed backoff)` as the delay. `Retry-After` is parsed as seconds (integer) or as an HTTP-date. If parsing fails, fall back to the computed backoff.
- Delay is implemented with `setTimeout` / `new Promise(resolve => setTimeout(resolve, delay))`.

### Attempt flow

```
attempt 0 (initial)
  → success or non-retryable → return result
  → retryable → wait backoff delay → attempt 1
  → retryable → wait backoff delay → attempt 2
  ...
  → attempt maxRetries → return last result regardless
```

Total attempts = `maxRetries + 1`. When retries are exhausted, the last attempt's status and body are returned — the abstraction never throws.

### Network errors

When `fetch` throws, the result for that attempt is `{ status: 0, body: error.message }`. This is retryable. If all retries exhaust with network errors, the final `status: 0` result is returned to the caller.

## Implementation

### File structure

```
packages/webhooks/src/api/features/WebhookDeliver/
├── abstractions.ts       — IWebhookDeliver, IWebhookDeliverInput, IWebhookDeliverResult
├── WebhookDeliver.ts     — Implementation with retry loop
├── feature.ts            — createFeature registration
└── index.ts              — Re-exports
```

### Implementation sketch

```typescript
class WebhookDeliverImpl implements IWebhookDeliver {
    async execute(input: IWebhookDeliverInput): Promise<IWebhookDeliverResult> {
        const startTime = Date.now();
        let lastResult: IWebhookDeliverResult;

        for (let attempt = 0; attempt <= input.maxRetries; attempt++) {
            if (attempt > 0) {
                const delay = this.computeDelay(attempt - 1, input, lastResult!);
                await this.sleep(delay);
            }

            lastResult = await this.attempt(input);

            if (!this.isRetryable(lastResult.status)) {
                break;
            }
        }

        return {
            ...lastResult!,
            responseTime: Date.now() - startTime,
            attempts: /* actual count */
        };
    }
}
```

Key details:

- `computeDelay` calculates `min(initialDelay * 2^attempt, maxDelay)`, then checks for a `Retry-After` header value stashed on the result when status is 429.
- `isRetryable` returns `true` for status 0, 429, or 500-599.
- `attempt` calls `fetch` with `AbortSignal.timeout(input.timeout)`, catches network errors, and returns `{ status, body }`.
- `sleep` is a simple `new Promise(resolve => setTimeout(resolve, ms))`.
- No dependencies — this is a pure I/O wrapper. Registered with `dependencies: []`.

### 429 Retry-After handling

The `attempt` method must capture the `Retry-After` header value when present so `computeDelay` can use it. The simplest approach: store the raw header string on an internal per-attempt result, then parse it in `computeDelay`:

- Integer value (e.g. `Retry-After: 5`) → delay of 5000 ms.
- HTTP-date (e.g. `Retry-After: Mon, 19 May 2026 12:00:00 GMT`) → `max(0, dateMs - Date.now())`.
- Missing or unparseable → use computed exponential backoff.
- Final delay is `max(parsedRetryAfter, computedBackoff)` — we never go below what our own backoff would have chosen.

## SendWebhookTask changes

Replace the inline fetch block (lines 92-110 in current code) with:

```typescript
const result = await this.deliver.execute({
    url: webhook.endpointUrl,
    headers: requestHeaders,
    body: rawBody,
    timeout: 600_000,
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30_000
});
```

Then use `result.status`, `result.body`, `result.responseTime` to update the delivery record. The `status > 0 ? "delivered" : "failed"` logic stays in the task.

Constructor gains `WebhookDeliver` dependency; `dependencies` array updated in `createImplementation`.

## Feature registration

```typescript
export const WebhookDeliverFeature = createFeature({
    name: "Webhooks/WebhookDeliver",
    register(container) {
        container.register(WebhookDeliver).inSingletonScope();
    }
});
```

Registered in `WebhooksFeature` alongside `SendWebhookTask`.

## Testing

### Unit tests (`__tests__/WebhookDeliver.test.ts`)

Test the retry loop in isolation by providing a mock fetch (or by injecting a test-only subclass). Key scenarios:

1. **Successful first attempt** — returns 200, `attempts: 1`, no retry.
2. **Network error then success** — first attempt throws, second returns 200. Verify `attempts: 2`.
3. **5xx then success** — first attempt returns 502, second returns 200.
4. **429 with Retry-After header** — verify delay respects the header value.
5. **429 with unparseable Retry-After** — falls back to exponential backoff.
6. **All retries exhausted** — returns last attempt's status/body, `attempts: maxRetries + 1`.
7. **maxRetries: 0** — single attempt, no retry regardless of outcome.
8. **Exponential backoff growth** — verify delay doubles each retry up to `maxDelay` cap.
9. **responseTime covers all attempts** — total wall-clock including delays.

### Integration with SendWebhookTask

Existing `SendWebhookTask` tests continue working — the task now delegates to the real `WebhookDeliver` implementation. No mocking needed for integration tests since they already use noop task infrastructure.

## Out of scope

- Per-webhook retry configuration (all webhooks use the same defaults from `SendWebhookTask`).
- Circuit breaker / global rate limiting across webhooks.
- Persisting per-attempt results (only the final result is stored on the delivery).
