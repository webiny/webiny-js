import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { TaskClaim } from "~/domain/TaskClaim.js";
import { ClaimRenewal } from "~/claim/ClaimRenewal.js";
import { CLAIM_RENEW_EVERY_MS } from "~/claim/constants.js";

const target = { tenant: "root", taskId: "task-1" };

// A claim whose `keep` answers from a script, one answer per renewal.
const createRenewal = (answers: Array<boolean | Error>) => {
    const keep = vi.fn(async () => {
        const answer = answers.shift() ?? true;
        if (answer instanceof Error) {
            throw answer;
        }
        return answer;
    });
    const claim = { keep } as unknown as TaskClaim.Interface;
    const onLost = vi.fn();
    const onError = vi.fn();
    const renewal = new ClaimRenewal({ claim, target, onLost, onError });
    return { renewal, keep, onLost, onError };
};

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("ClaimRenewal", () => {
    it("extends the claim on every tick while it runs", async () => {
        const { renewal, keep } = createRenewal([]);

        renewal.start();
        await vi.advanceTimersByTimeAsync(CLAIM_RENEW_EVERY_MS * 3);
        renewal.stop();
        await vi.advanceTimersByTimeAsync(CLAIM_RENEW_EVERY_MS * 3);

        expect(keep).toHaveBeenCalledTimes(3);
    });

    it("reports the claim lost once, and stops extending it", async () => {
        const { renewal, keep, onLost } = createRenewal([true, false]);

        renewal.start();
        await vi.advanceTimersByTimeAsync(CLAIM_RENEW_EVERY_MS * 4);

        expect(renewal.isLost()).toBe(true);
        expect(onLost).toHaveBeenCalledTimes(1);
        expect(keep).toHaveBeenCalledTimes(2);
    });

    // One failed write leaves the claim with most of its time, so the next tick just tries again.
    it("does not count a failed write as lost", async () => {
        const { renewal, onLost, onError } = createRenewal([new Error("timeout"), true]);

        renewal.start();
        await vi.advanceTimersByTimeAsync(CLAIM_RENEW_EVERY_MS * 2);
        renewal.stop();

        expect(renewal.isLost()).toBe(false);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onLost).not.toHaveBeenCalled();
    });
});
