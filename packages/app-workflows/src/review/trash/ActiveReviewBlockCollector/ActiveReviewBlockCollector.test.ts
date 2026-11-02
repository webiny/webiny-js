import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";
import { ActiveReviewBlockCollector as Abstraction } from "./abstractions.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollector.js";
import { createBlockingReview } from "~/review/testing/reviewFixtures.js";

function data(...reviews: BlockingReview[]): ActiveReviewOnTrashData {
    return { model: "cms.article", action: "trash", reviews };
}

describe("ActiveReviewBlockCollector", () => {
    let collector: Abstraction.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        collector = container.resolve(Abstraction);
    });

    it("collects nothing without an active run", () => {
        expect(
            collector.collects(data(createBlockingReview({ reviewId: "r1", targetId: "e1" })))
        ).toBe(false);
    });

    it("collects a refusal whose target belongs to an active run", () => {
        collector.begin(["e1", "e2"]);

        expect(
            collector.collects(data(createBlockingReview({ reviewId: "r1", targetId: "e2" })))
        ).toBe(true);
    });

    it("does not collect a refusal of an unrelated target", () => {
        collector.begin(["e1"]);

        expect(
            collector.collects(data(createBlockingReview({ reviewId: "r9", targetId: "e9" })))
        ).toBe(false);
    });

    it("stores only the reviews of the run's own targets", () => {
        const runId = collector.begin(["e1"]);

        collector.add(
            data(
                createBlockingReview({ reviewId: "r1", targetId: "e1" }),
                createBlockingReview({ reviewId: "r9", targetId: "e9" })
            )
        );
        collector.end(runId);

        const collected = collector.drain(runId);
        expect(collected).toHaveLength(1);
        expect(collected[0].reviews.map(item => item.reviewId)).toEqual(["r1"]);
        expect(collected[0].action).toBe("trash");
    });

    it("does not store a refusal that matches no run", () => {
        const runId = collector.begin(["e1"]);

        collector.add(data(createBlockingReview({ reviewId: "r9", targetId: "e9" })));
        collector.end(runId);

        expect(collector.drain(runId)).toEqual([]);
    });

    it("keeps overlapping runs apart", () => {
        const runA = collector.begin(["e1"]);
        const runB = collector.begin(["e2"]);

        collector.add(data(createBlockingReview({ reviewId: "r1", targetId: "e1" })));
        collector.add(data(createBlockingReview({ reviewId: "r2", targetId: "e2" })));
        collector.add(
            data(
                createBlockingReview({ reviewId: "r3", targetId: "e1" }),
                createBlockingReview({ reviewId: "r4", targetId: "e2" })
            )
        );
        collector.end(runA);
        collector.end(runB);

        const forA = collector.drain(runA);
        const forB = collector.drain(runB);
        expect(forA.flatMap(item => item.reviews.map(r => r.reviewId))).toEqual(["r1", "r3"]);
        expect(forB.flatMap(item => item.reviews.map(r => r.reviewId))).toEqual(["r2", "r4"]);
    });

    it("stops collecting when a run ends but keeps its data until drained", () => {
        const runId = collector.begin(["e1"]);
        collector.add(data(createBlockingReview({ reviewId: "r1", targetId: "e1" })));

        collector.end(runId);

        expect(
            collector.collects(data(createBlockingReview({ reviewId: "r2", targetId: "e1" })))
        ).toBe(false);
        collector.add(data(createBlockingReview({ reviewId: "r2", targetId: "e1" })));
        const collected = collector.drain(runId);
        expect(collected.flatMap(item => item.reviews.map(r => r.reviewId))).toEqual(["r1"]);
    });

    it("removes a run when it is drained", () => {
        const runId = collector.begin(["e1"]);
        collector.add(data(createBlockingReview({ reviewId: "r1", targetId: "e1" })));
        collector.end(runId);

        expect(collector.drain(runId)).toHaveLength(1);
        expect(collector.drain(runId)).toEqual([]);
    });

    it("returns an empty list for an unknown run id", () => {
        expect(collector.drain("unknown-run")).toEqual([]);
        collector.end("unknown-run");
    });

    it("gives every run its own id", () => {
        const first = collector.begin(["e1"]);
        const second = collector.begin(["e1"]);

        expect(first).not.toBe(second);
    });
});
