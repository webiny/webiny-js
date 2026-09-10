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

export interface UseActivityTimelineParams {
    targetType: string;
    targetId: string;
    modelId: string;
}

export interface UseActivityTimelineResult {
    view: TimelineView;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    filters: TimelineFilters;
    setFilters(filters: TimelineFilters): void;
    clearFilters(): void;
    loadMore(): void;
    reload(): void;
}

/**
 * Fetching, paging and filtering. No shaping and no rendering.
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
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<TimelineFilters>({});

    // Guards against a stale response overwriting a newer one — changing a filter mid-flight
    // otherwise repaints the timeline with the previous filter's results.
    const requestId = useRef(0);

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

                setRecords(previous =>
                    append ? [...previous, ...result.records] : result.records
                );
                setCursor(result.cursor);
                setHasMore(result.hasMore);
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

    useEffect(() => {
        void fetchPage(null, false, filters);
    }, [fetchPage, filters]);

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
        () => buildTimelineView({ records, filters, hasMore }),
        [records, filters, hasMore]
    );

    return {
        view,
        loading,
        loadingMore,
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
