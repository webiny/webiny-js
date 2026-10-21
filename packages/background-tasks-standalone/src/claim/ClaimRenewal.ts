import type { TaskClaim } from "~/domain/TaskClaim.js";
import { CLAIM_RENEW_EVERY_MS } from "./constants.js";
import { CLAIM_TTL_MS } from "./constants.js";

interface IClaimRenewalParams {
    claim: TaskClaim.Interface;
    target: TaskClaim.Target;
    // Called once, when an extension finds that this process no longer holds the claim.
    onLost: () => void;
    // Called for an extension that could not be written. The next one tries again.
    onError: (error: unknown) => void;
}

/**
 * Keeps extending a claim while one iteration of its task runs, since an iteration can run far longer
 * than the claim lasts. Started before the iteration and stopped after it.
 */
export class ClaimRenewal {
    private readonly params: IClaimRenewalParams;
    private interval: ReturnType<typeof setInterval> | undefined;
    private lost = false;

    public constructor(params: IClaimRenewalParams) {
        this.params = params;
    }

    public isLost(): boolean {
        return this.lost;
    }

    public start(): void {
        this.interval = setInterval(() => {
            void this.renew();
        }, CLAIM_RENEW_EVERY_MS);
    }

    public stop(): void {
        clearInterval(this.interval);
        this.interval = undefined;
    }

    /*
     * Only an answer of `false` loses the claim. A write that fails is retried on the next tick: one
     * slow or failed write leaves the claim with most of its time, and if they keep failing until it
     * runs out, the next write that gets through answers `false`.
     */
    private async renew(): Promise<void> {
        if (this.lost) {
            return;
        }
        let held: boolean;
        try {
            held = await this.params.claim.keep(this.params.target, CLAIM_TTL_MS);
        } catch (error) {
            this.params.onError(error);
            return;
        }
        if (held) {
            return;
        }
        this.lost = true;
        this.stop();
        this.params.onLost();
    }
}
