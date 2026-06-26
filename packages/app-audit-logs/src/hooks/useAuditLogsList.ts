import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFeature } from "@webiny/app";
import { ListAuditLogsFeature } from "~/features/listAuditLogs/index.js";
import type { IListAuditLogsVariablesWhere } from "~/hooks/graphql.js";
import type { IAuditLog, IAuditLogsMeta } from "~/types.js";
import type { OnDataTableSortingChange, DataTableSorting } from "@webiny/admin-ui";

export interface UseAuditLogs {
    isListLoading: boolean;
    isListLoadingMore: boolean;
    records: IAuditLog[];
    meta: IAuditLogsMeta;
    listMoreRecords: () => void;
    setWhere: (where: Partial<IListAuditLogsVariablesWhere>) => void;
    setLimit: (limit: number) => void;
    after?: string;
    sorting: DataTableSorting;
    setSorting: OnDataTableSortingChange;
    showingFilters: boolean;
    showFilters: () => void;
    hideFilters: () => void;
}

interface ListVariables {
    where: Record<string, unknown>;
    after: string | undefined;
    sort: "ASC" | "DESC";
    limit: number;
}

export const useAuditLogsList = (): UseAuditLogs => {
    const { useCase } = useFeature(ListAuditLogsFeature);

    const [variables, setVariables] = useState<ListVariables>({
        where: {},
        after: undefined,
        sort: "DESC",
        limit: 25
    });

    const [accumulatedRecords, setAccumulatedRecords] = useState<IAuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<IAuditLogsMeta>({
        hasMoreItems: false,
        cursor: null
    });

    const setWhere = useCallback((where: Partial<IListAuditLogsVariablesWhere>) => {
        setVariables(prev => ({ ...prev, where, after: undefined }));
        setAccumulatedRecords([]);
    }, []);

    const setSort = useCallback((sort: "ASC" | "DESC") => {
        setVariables(prev => ({ ...prev, sort, after: undefined }));
        setAccumulatedRecords([]);
    }, []);

    const setAfter = useCallback((after?: string) => {
        setVariables(prev => ({ ...prev, after }));
    }, []);

    const setLimit = useCallback((limit: number) => {
        setVariables(prev => ({ ...prev, limit }));
    }, []);

    const [showingFilters, setShowingFilters] = useState(false);
    const [acoSorting, setAcoSorting] = useState<DataTableSorting>([]);

    useEffect(() => {
        const sort = acoSorting[0];
        if (!sort) {
            return;
        }
        setSort(sort.desc ? "DESC" : "ASC");
    }, [acoSorting]);

    const requestIdRef = useRef(0);

    useEffect(() => {
        setLoading(true);
        const requestId = ++requestIdRef.current;

        useCase.execute(variables).then(result => {
            if (requestId !== requestIdRef.current) {
                return;
            }

            if (variables.after) {
                setAccumulatedRecords(prev => [...prev, ...result.records]);
            } else {
                setAccumulatedRecords(result.records);
            }

            setMeta(result.meta);
            setLoading(false);
        });
    }, [variables]);

    const sorting = useMemo((): DataTableSorting => {
        return [
            {
                id: "createdOn",
                desc: variables.sort === "DESC"
            }
        ];
    }, [variables.sort]);

    return {
        isListLoading: loading,
        records: accumulatedRecords,
        meta,
        listMoreRecords: () => {
            setAfter(meta.cursor || undefined);
        },
        setWhere,
        sorting,
        setSorting: setAcoSorting,
        setLimit,
        isListLoadingMore: loading && !!variables.after,
        showingFilters,
        showFilters: () => {
            setShowingFilters(true);
        },
        hideFilters: () => {
            setShowingFilters(false);
        }
    };
};
