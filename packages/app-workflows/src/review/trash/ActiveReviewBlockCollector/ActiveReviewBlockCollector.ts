import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import { ActiveReviewBlockCollector as Abstraction } from "./abstractions.js";

interface CollectorRun {
    targetIds: Set<string>;
    active: boolean;
    collected: ActiveReviewOnTrashData[];
}

function ownsTarget(run: CollectorRun, data: ActiveReviewOnTrashData): boolean {
    return data.reviews.some(review => run.targetIds.has(review.targetId));
}

class ActiveReviewBlockCollectorImpl implements Abstraction.Interface {
    private runs = new Map<string, CollectorRun>();
    private counter = 0;

    begin(targetIds: string[]): string {
        this.counter += 1;
        const runId = `active-review-run-${this.counter}`;
        const ids = new Set(targetIds);
        this.runs.set(runId, { targetIds: ids, active: true, collected: [] });
        return runId;
    }

    collects(data: ActiveReviewOnTrashData): boolean {
        for (const run of this.runs.values()) {
            if (run.active && ownsTarget(run, data)) {
                return true;
            }
        }

        return false;
    }

    add(data: ActiveReviewOnTrashData): void {
        for (const run of this.runs.values()) {
            if (!run.active) {
                continue;
            }

            const reviews = data.reviews.filter(review => run.targetIds.has(review.targetId));
            if (reviews.length === 0) {
                continue;
            }

            run.collected.push({ ...data, reviews });
        }
    }

    drain(runId: string): ActiveReviewOnTrashData[] {
        const run = this.runs.get(runId);
        if (!run) {
            return [];
        }

        this.runs.delete(runId);
        return run.collected;
    }

    end(runId: string): void {
        const run = this.runs.get(runId);
        if (run) {
            run.active = false;
        }
    }
}

export const ActiveReviewBlockCollector = Abstraction.createImplementation({
    implementation: ActiveReviewBlockCollectorImpl,
    dependencies: []
});
