import { TenantScopeUsage as Abstraction_ } from "./abstractions.js";
import { Logger } from "~/features/logger/index.js";

/**
 * More scopes in use at once than this logs the request's summary as a warning: something kept that
 * many tenants' scopes busy at the same time (a `Promise.all` over every tenant), and no cache limit
 * can free a scope in use.
 */
export const TENANT_SCOPES_IN_USE_WARNING = 50;

const round = (ms: number) => Math.round(ms * 100) / 100;

class TenantScopeUsageImpl implements Abstraction_.Interface {
    private summary: Abstraction_.Summary = {
        built: 0,
        released: 0,
        peakHeld: 0,
        peakInUse: 0,
        buildMs: 0
    };

    constructor(private readonly logger: Logger.Interface | undefined) {}

    scopeBuilt(durationMs: number): void {
        this.summary.built++;
        this.summary.buildMs += durationMs;
    }

    scopeReleased(): void {
        this.summary.released++;
    }

    counts(held: number, inUse: number): void {
        this.summary.peakHeld = Math.max(this.summary.peakHeld, held);
        this.summary.peakInUse = Math.max(this.summary.peakInUse, inUse);
    }

    getSummary(): Abstraction_.Summary {
        return { ...this.summary, buildMs: round(this.summary.buildMs) };
    }

    report(): void {
        if (!this.logger) {
            return;
        }
        const summary = this.getSummary();
        if (summary.peakInUse > TENANT_SCOPES_IN_USE_WARNING) {
            this.logger.warn(
                summary,
                `[tenancy] ${summary.peakInUse} tenant scopes were in use at once in this request (more than ${TENANT_SCOPES_IN_USE_WARNING}). A scope in use is never released: run per-tenant work one tenant at a time to keep memory bounded.`
            );
            return;
        }
        this.logger.debug(summary, "[tenancy] Tenant scopes of this request.");
    }
}

export const TenantScopeUsage = Abstraction_.createImplementation({
    implementation: TenantScopeUsageImpl,
    dependencies: [[Logger, { optional: true }]]
});
