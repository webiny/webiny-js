import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useContainer } from "@webiny/app";
import { ActivityLogGateway } from "~/gateway/ActivityLogGateway.js";
import type { TimelineRecord } from "~/timeline/types.js";
import {
    buildTimelineView,
    hasActiveFilters,
    type TimelineFilters,
    type TimelineView
} from "./buildTimelineView.js";

const PAGE_SIZE = 25;

/**
 * How long a refresh waits for a write to become visible, and in how many attempts.
 *
 * A record is written *inside* the entry write — event handlers run inline, sequentially and
 * awaited — so by the time the save mutation returns, the record is already persisted. On a
 * DynamoDB-only or SQL install the first attempt therefore succeeds and the rest never run.
 *
 * The retries exist for one specific deployment: on DynamoDB-and-OpenSearch, listing entries reads
 * OpenSearch, which is fed by a DynamoDB stream. "Persisted" and "visible to a query" are seconds
 * apart there, so a single refetch on save would usually come back without the very record the
 * reader just caused — reproducing the bug this refresh exists to fix.
 *
 * Bounded on purpose. If the budget runs out the timeline keeps whatever it last saw and says
 * nothing: a save that produced no record at all is indistinguishable from one still in flight, and
 * guessing which is worse than being one refresh behind.
 */
const REFRESH_ATTEMPT_DELAYS_MS = [0, 400, 800, 1500, 2500];

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export interface UseActivityTimelineParams {
    targetType: string;
    targetId: string;
    modelId: string;
    /**
     * An opaque string that changes whenever the target has been written. A change refreshes the
     * timeline in place, without the loading state — see `writeSignature`.
     */
    writeToken?: string;
    /** The revision the form is showing, so its group can be marked current. */
    currentRevision?: string;
    /** The current revision's publishing status, which only the form knows. */
    currentStatus?: string | null;
}

export interface UseActivityTimelineResult {
    view: TimelineView;
    loading: boolean;
    loadingMore: boolean;
    /** A refresh is in flight, with the previous records still on screen. */
    refreshing: boolean;
    error: string | null;
    hasMore: boolean;
    filters: TimelineFilters;
    setFilters(filters: TimelineFilters): void;
    clearFilters(): void;
    loadMore(): void;
    reload(): void;
}

/**
 * Fetching, paging, filtering and refreshing. No shaping and no rendering.
 *
 * The shaping is `buildTimelineView`, a pure function, so the only thing that needs React here is
 * the state machine around it. That division is the whole point of the checkpoint: the design
 * handover replaces presentation, and must not have to reimplement any of the shaping to do it.
 */
export const useActivityTimeline = (
    params: UseActivityTimelineParams
): UseActivityTimelineResult => {
    const container = useContainer();
    const gateway = useMemo(() => container.resolve(ActivityLogGateway), [container]);

    const [records, setRecords] = useState<TimelineRecord[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<TimelineFilters>({});

    // Guards against a stale response overwriting a newer one — changing a filter mid-flight
    // otherwise repaints the timeline with the previous filter's results. A refresh takes a ticket
    // too, so anything the reader does cancels a retry loop still waiting to try again.
    const requestId = useRef(0);

    // The newest record on screen, which is how a refresh tells "the write landed" from "the read
    // model has not caught up yet". Held in a ref because the retry loop reads it between awaits.
    const newestRecordId = useRef<string | null>(null);

    // Whether the reader has paged past the first page, which changes what a refresh may replace.
    const hasPaged = useRef(false);

    const fetchPage = useCallback(
        async (after: string | null, append: boolean, activeFilters: TimelineFilters) => {
            const id = ++requestId.current;

            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                const result = await gateway.list({
                    targetType: params.targetType,
                    targetId: params.targetId,
                    modelId: params.modelId,
                    revision: activeFilters.revision,
                    actorId: activeFilters.actorId,
                    limit: PAGE_SIZE,
                    after
                });

                if (id !== requestId.current) {
                    return;
                }

                if (result.error) {
                    setError(result.error.message);
                    return;
                }

                setRecords(previous => {
                    const next = append ? [...previous, ...result.records] : result.records;
                    newestRecordId.current = next[0]?.id ?? null;
                    return next;
                });
                setCursor(result.cursor);
                setHasMore(result.hasMore);

                if (append) {
                    hasPaged.current = true;
                } else {
                    hasPaged.current = false;
                }
            } catch (caught) {
                if (id !== requestId.current) {
                    return;
                }
                setError(caught instanceof Error ? caught.message : "Failed to load activity.");
            } finally {
                if (id === requestId.current) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        },
        [gateway, params.targetType, params.targetId, params.modelId]
    );

    /**
     * Re-reads the newest page after a write, leaving what is on screen in place while it does.
     *
     * Not `fetchPage`, for two reasons a shared implementation would have to branch on anyway.
     * It must not raise the loading state — that renders a skeleton, so every save would blank the
     * timeline the reader is looking at. And it must not surface an error: replacing a good
     * timeline with "Could not load activity" because a background refetch blipped is strictly
     * worse than showing slightly stale rows, and the reader did not ask for this fetch.
     */
    const refresh = useCallback(
        async (activeFilters: TimelineFilters) => {
            const id = ++requestId.current;
            const previousNewestId = newestRecordId.current;

            // With a filter on, a new record may legitimately not match it, so "nothing new
            // arrived" is not evidence of a lagging read model and there is nothing to wait for.
            const expectNewRecord = !hasActiveFilters(activeFilters);

            setRefreshing(true);

            try {
                for (const delay of REFRESH_ATTEMPT_DELAYS_MS) {
                    if (delay > 0) {
                        await wait(delay);
                    }

                    if (id !== requestId.current) {
                        return;
                    }

                    const result = await gateway.list({
                        targetType: params.targetType,
                        targetId: params.targetId,
                        modelId: params.modelId,
                        revision: activeFilters.revision,
                        actorId: activeFilters.actorId,
                        limit: PAGE_SIZE,
                        after: null
                    });

                    if (id !== requestId.current) {
                        return;
                    }

                    if (result.error) {
                        return;
                    }

                    const newestId = result.records[0]?.id ?? null;

                    if (hasPaged.current) {
                        // The reader has older pages on screen. The log is append-only and read
                        // newest-first, so everything this page returns is at least as new as what
                        // is held: merging by id keeps their pages rather than collapsing back to
                        // one. Their paging position is untouched — the oldest row on screen is
                        // still the oldest — so the existing cursor and `hasMore` still describe
                        // what comes after it, and taking this page's cursor would re-serve rows
                        // already visible.
                        setRecords(previous => {
                            const seen = new Set(result.records.map(record => record.id));
                            const next = [
                                ...result.records,
                                ...previous.filter(record => !seen.has(record.id))
                            ];
                            newestRecordId.current = next[0]?.id ?? null;
                            return next;
                        });
                    } else {
                        setRecords(result.records);
                        setCursor(result.cursor);
                        setHasMore(result.hasMore);
                        newestRecordId.current = newestId;
                    }

                    if (!expectNewRecord || newestId !== previousNewestId) {
                        return;
                    }
                }
            } finally {
                if (id === requestId.current) {
                    setRefreshing(false);
                }
            }
        },
        [gateway, params.targetType, params.targetId, params.modelId]
    );

    useEffect(() => {
        void fetchPage(null, false, filters);
    }, [fetchPage, filters]);

    // The initial value is recorded rather than acted on: the fetch above already covers the first
    // render, and refreshing on mount would fetch the same page twice.
    const lastWriteToken = useRef(params.writeToken);

    useEffect(() => {
        if (params.writeToken === lastWriteToken.current) {
            return;
        }

        lastWriteToken.current = params.writeToken;
        void refresh(filters);
    }, [params.writeToken, filters, refresh]);

    const loadMore = useCallback(() => {
        if (!hasMore || loadingMore || cursor === null) {
            return;
        }
        void fetchPage(cursor, true, filters);
    }, [cursor, fetchPage, filters, hasMore, loadingMore]);

    const reload = useCallback(() => {
        void fetchPage(null, false, filters);
    }, [fetchPage, filters]);

    const clearFilters = useCallback(() => setFilters({}), []);

    const view = useMemo(
        () =>
            buildTimelineView({
                records,
                filters,
                hasMore,
                currentRevision: params.currentRevision,
                currentStatus: params.currentStatus
            }),
        [records, filters, hasMore, params.currentRevision, params.currentStatus]
    );

    return {
        view,
        loading,
        loadingMore,
        refreshing,
        error,
        hasMore,
        filters,
        setFilters,
        clearFilters,
        loadMore,
        reload
    };
};

export { hasActiveFilters };
export type { TimelineFilters, TimelineView };
