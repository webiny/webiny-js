import {
    WebhookDeliver as Abstraction,
    type IWebhookDeliverInput,
    type IWebhookDeliverResult
} from "./abstractions.js";

interface IAttemptResult {
    status: number;
    body: string;
    retryAfter: string | null;
}

class WebhookDeliverImpl implements Abstraction.Interface {
    public async execute(input: IWebhookDeliverInput): Promise<IWebhookDeliverResult> {
        const startTime = Date.now();
        let attempts = 0;
        let lastResult: IAttemptResult = { status: 0, body: "", retryAfter: null };

        for (let i = 0; i <= input.maxRetries; i++) {
            if (i > 0) {
                const delay = this.computeDelay(i - 1, input, lastResult);
                await this.sleep(delay);
            }

            attempts++;
            lastResult = await this.attempt(input);

            if (!this.isRetryable(lastResult.status)) {
                break;
            }
        }

        return {
            status: lastResult.status,
            body: lastResult.body,
            responseTime: Date.now() - startTime,
            attempts
        };
    }

    private async attempt(input: IWebhookDeliverInput): Promise<IAttemptResult> {
        try {
            const response = await fetch(input.url, {
                method: "POST",
                headers: input.headers,
                body: input.body,
                signal: AbortSignal.timeout(input.timeout)
            });

            const body = await response.text();
            const retryAfter = response.headers.get("retry-after");

            return { status: response.status, body, retryAfter };
        } catch (error) {
            return {
                status: 0,
                body: error instanceof Error ? error.message : "Unknown fetch error",
                retryAfter: null
            };
        }
    }

    private isRetryable(status: number): boolean {
        if (status === 0 || status === 429) {
            return true;
        }
        return status >= 500 && status <= 599;
    }

    private computeDelay(
        retryIndex: number,
        input: IWebhookDeliverInput,
        lastResult: IAttemptResult
    ): number {
        const exponential = Math.min(input.initialDelay * Math.pow(2, retryIndex), input.maxDelay);

        if (lastResult.status === 429 && lastResult.retryAfter) {
            const parsed = this.parseRetryAfter(lastResult.retryAfter);
            if (parsed !== null) {
                return Math.max(parsed, exponential);
            }
        }

        return exponential;
    }

    private parseRetryAfter(value: string): number | null {
        const seconds = Number(value);
        if (!Number.isNaN(seconds) && Number.isFinite(seconds) && seconds >= 0) {
            return seconds * 1000;
        }

        const dateMs = Date.parse(value);
        if (!Number.isNaN(dateMs)) {
            return Math.max(0, dateMs - Date.now());
        }

        return null;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const WebhookDeliver = Abstraction.createImplementation({
    implementation: WebhookDeliverImpl,
    dependencies: []
});
