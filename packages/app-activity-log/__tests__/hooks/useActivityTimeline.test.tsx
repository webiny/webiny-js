import React from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { ActivityLogGateway } from "~/gateway/ActivityLogGateway.js";
import { useActivityTimeline } from "~/hooks/useActivityTimeline.js";
import type { TimelineRecord } from "~/timeline/types.js";

/**
 * The refresh-on-save behaviour, which is the part of this feature a reader notices when it is
 * missing: before it existed, a save left the timeline stale until the entry was re-opened.
 *
 * Worth testing at the hook rather than through the component, because the interesting parts are
 * all invisible in the markup — whether a refresh raises the loading state, whether it retries
 * while the read model catches up, and when it stops retrying.
 */

let seq = 0;

const record = (overrides: Partial<TimelineRecord> = {}): TimelineRecord => {
    seq++;
    return {
        id: `rec-${seq}`,
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0001",
        timestamp: "2026-09-10T10:00:00.000Z",
        actor: { id: "u-1", type: "admin", displayName: "Ada" },
        action: "entry.update",
        source: "admin",
        correlationId: `corr-${seq}`,
        changeset: [],
        truncated: false,
        ...overrides
    };
};

const page = (records: TimelineRecord[], overrides: Partial<ActivityLogGateway.Result> = {}) => ({
    records,
    cursor: null,
    hasMore: false,
    error: null,
    ...overrides
});

/**
 * A gateway that serves a scripted sequence of responses, the last one repeating.
 *
 * Repeating rather than exhausting matters: the retry loop is meant to keep asking, and a script
 * that ran out would fail the test with an unrelated error instead of showing what the loop did.
 */
const scriptedGateway = (responses: ActivityLogGateway.Result[]) => {
    const list = vi.fn(async (_params: ActivityLogGateway.Params) => {
        const next = responses[Math.min(list.mock.calls.length - 1, responses.length - 1)];
        return next!;
    });

    return { list };
};

const harness = (gateway: { list: ReturnType<typeof scriptedGateway>["list"] }) => {
    const container = new Container();
    container.registerInstance(ActivityLogGateway, gateway as ActivityLogGateway.Interface);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DiContainerProvider container={container}>{children}</DiContainerProvider>
    );

    return renderHook(
        (props: { writeToken?: string }) =>
            useActivityTimeline({
                targetType: "cms-entry",
                targetId: "abc",
                modelId: "article",
                writeToken: props.writeToken
            }),
        { wrapper, initialProps: { writeToken: "v1" } }
    );
};

/** Lets the mount fetch settle. */
const settle = async () => {
    await act(async () => {
        await Promise.resolve();
    });
};

afterEach(() => {
    vi.useRealTimers();
});

describe("the first load", () => {
    it("fetches once and leaves the loading state", async () => {
        const gateway = scriptedGateway([page([record()])]);
        const { result } = harness(gateway);

        await settle();

        expect(gateway.list).toHaveBeenCalledTimes(1);
        expect(result.current.loading).toBe(false);
        expect(result.current.view.groups).toHaveLength(1);
    });

    it("does not treat the initial write token as a write", async () => {
        // The mount fetch already covers the first render. Refreshing on top of it would fetch the
        // same page twice on every entry open.
        const gateway = scriptedGateway([page([record()])]);
        harness(gateway);

        await settle();

        expect(gateway.list).toHaveBeenCalledTimes(1);
    });
});

describe("refreshing after a save", () => {
    it("refetches when the write token changes", async () => {
        const first = record({ action: "entry.create" });
        const saved = record({ action: "entry.update" });
        const gateway = scriptedGateway([page([first]), page([saved, first])]);
        const { result, rerender } = harness(gateway);

        await settle();
        expect(result.current.view.groups[0]!.items).toHaveLength(1);

        await act(async () => {
            rerender({ writeToken: "v2" });
        });
        await settle();

        expect(gateway.list).toHaveBeenCalledTimes(2);
        expect(result.current.view.groups[0]!.items).toHaveLength(2);
    });

    it("does not raise the loading state, so the rows stay on screen", async () => {
        // The whole reason a refresh is not a reload: `loading` renders a skeleton in place of the
        // timeline, and a save would blank what the reader is looking at.
        const first = record();
        const gateway = scriptedGateway([page([first]), page([record(), first])]);
        const { result, rerender } = harness(gateway);

        await settle();

        let loadingDuringRefresh: boolean | null = null;

        await act(async () => {
            rerender({ writeToken: "v2" });
            loadingDuringRefresh = result.current.loading;
        });
        await settle();

        expect(loadingDuringRefresh).toBe(false);
        expect(result.current.loading).toBe(false);
    });

    it("does not refetch when the token is unchanged", async () => {
        const gateway = scriptedGateway([page([record()])]);
        const { rerender } = harness(gateway);

        await settle();

        await act(async () => {
            rerender({ writeToken: "v1" });
        });
        await settle();

        expect(gateway.list).toHaveBeenCalledTimes(1);
    });
});

describe("waiting for an eventually consistent read model", () => {
    it("retries until the new record appears", async () => {
        vi.useFakeTimers();

        // Two stale responses, then the record lands — what a DynamoDB-and-OpenSearch install does
        // while the stream catches up.
        // Distinct actions, so the two rows do not collapse into one — the collapse rule merges a
        // run of saves by the same person, which would hide the very arrival being asserted.
        const first = record({ action: "entry.create" });
        const saved = record({ action: "entry.update" });
        const gateway = scriptedGateway([
            page([first]),
            page([first]),
            page([first]),
            page([saved, first])
        ]);
        const { result, rerender } = harness(gateway);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });

        await act(async () => {
            rerender({ writeToken: "v2" });
        });

        // First attempt is immediate and comes back stale.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(gateway.list).toHaveBeenCalledTimes(2);
        expect(result.current.refreshing).toBe(true);

        // 400ms, then 800ms, at which point it lands.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(400);
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(800);
        });

        expect(gateway.list).toHaveBeenCalledTimes(4);
        expect(result.current.refreshing).toBe(false);
        expect(result.current.view.groups[0]!.items).toHaveLength(2);
    });

    it("stops after the budget, keeping what it has and reporting no error", async () => {
        vi.useFakeTimers();

        // Nothing ever lands — a save that produced no record is indistinguishable from one still
        // in flight, so the loop must give up quietly rather than spin or claim a failure.
        const first = record();
        const gateway = scriptedGateway([page([first])]);
        const { result, rerender } = harness(gateway);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });
        await act(async () => {
            rerender({ writeToken: "v2" });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(10_000);
        });

        // Mount plus the five bounded attempts, and then it stops.
        expect(gateway.list).toHaveBeenCalledTimes(6);
        expect(result.current.refreshing).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.view.groups[0]!.items).toHaveLength(1);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(10_000);
        });
        expect(gateway.list).toHaveBeenCalledTimes(6);
    });

    it("does not wait when a filter is active", async () => {
        vi.useFakeTimers();

        // With a filter on, a new record may legitimately not match it, so "nothing new arrived" is
        // not evidence of a lagging read model and there is nothing to wait for.
        const first = record();
        const gateway = scriptedGateway([page([first])]);
        const { result, rerender } = harness(gateway);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });

        await act(async () => {
            result.current.setFilters({ actorId: "u-9" });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });

        const callsBeforeSave = gateway.list.mock.calls.length;

        await act(async () => {
            rerender({ writeToken: "v2" });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(10_000);
        });

        expect(gateway.list).toHaveBeenCalledTimes(callsBeforeSave + 1);
    });
});

describe("a refresh that fails", () => {
    it("keeps the existing timeline instead of replacing it with an error", async () => {
        // The reader did not ask for this fetch. Turning a good timeline into "Could not load
        // activity" because a background refetch blipped is worse than showing stale rows.
        const first = record();
        const gateway = scriptedGateway([
            page([first]),
            page([], { error: { message: "network down", code: null } })
        ]);
        const { result, rerender } = harness(gateway);

        await settle();

        await act(async () => {
            rerender({ writeToken: "v2" });
        });
        await settle();

        expect(result.current.error).toBeNull();
        expect(result.current.view.groups[0]!.items).toHaveLength(1);
    });
});
