import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useContainer } from "@webiny/app";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import {
    type IListAuditLogsResponse,
    type IListAuditLogsVariablesPartial,
    type IListAuditLogsVariablesWhere,
    LIST_AUDIT_LOGS
} from "~/hooks/graphql.js";
import type { IAuditLog, IAuditLogsMeta } from "~/types.js";
import type { OnDataTableSortingChange, DataTableSorting } from "@webiny/admin-ui";
import { transformRawAuditLog } from "~/utils/transformRawAuditLog.js";
import { listAuditLogsSchema } from "~/hooks/schema.js";

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

export const useAuditLogsList = (): UseAuditLogs => {
    const container = useContainer();
    const client = container.resolve(MainGraphQLClient);

    const [variables, setVariables] = useState<IListAuditLogsVariablesPartial>({
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

        client
            .execute<IListAuditLogsResponse>({
                query: LIST_AUDIT_LOGS,
                variables
            })
            .then(response => {
                if (requestId !== requestIdRef.current) {
                    return;
                }

                const responseData = response.auditLogs.listAuditLogs;

                if (responseData.data) {
                    const items = listAuditLogsSchema.safeParse(responseData.data);
                    if (items.success) {
                        const newRecords = items.data.map(auditLog =>
                            transformRawAuditLog({ auditLog })
                        );
                        if (variables.after) {
                            setAccumulatedRecords(prev => [...prev, ...newRecords]);
                        } else {
                            setAccumulatedRecords(newRecords);
                        }
                    } else {
                        console.error(items.error);
                    }
                }

                if (responseData.meta) {
                    setMeta(responseData.meta);
                }

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
