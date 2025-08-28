import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/react-hooks";
import {
    type IListAuditLogsResponse,
    type IListAuditLogsVariablesPartial,
    type IListAuditLogsVariablesWhere,
    LIST_AUDIT_LOGS
} from "~/hooks/graphql.js";
import type { IAuditLog, IAuditLogsMeta } from "~/types.js";
import type { OnSortingChange, Sorting } from "@webiny/ui/DataTable/index.js";
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
    sorting: Sorting;
    setSorting: OnSortingChange;
    showingFilters: boolean;
    showFilters: () => void;
    hideFilters: () => void;
}

export const useAuditLogsList = (): UseAuditLogs => {
    const [variables, setVariables] = useState<IListAuditLogsVariablesPartial>({
        where: {},
        after: undefined,
        sort: "DESC",
        limit: 25
    });

    const setWhere = useCallback(
        (where: Partial<IListAuditLogsVariablesWhere>) => {
            setVariables(prev => ({
                ...prev,
                where
            }));
        },
        [variables]
    );
    const setSort = useCallback(
        (sort: "ASC" | "DESC") => {
            setVariables(prev => ({
                ...prev,
                sort
            }));
        },
        [variables]
    );
    const setAfter = useCallback(
        (after?: string) => {
            setVariables(prev => ({
                ...prev,
                after
            }));
        },
        [variables]
    );
    const setLimit = useCallback(
        (limit: number) => {
            setVariables(prev => ({
                ...prev,
                limit
            }));
        },
        [variables]
    );

    const [showingFilters, setShowingFilters] = useState(false);
    const [acoSorting, setAcoSorting] = useState<Sorting>([]);

    useEffect(() => {
        const sort = acoSorting[0];
        if (!sort) {
            return;
        }
        setSort(sort.desc ? "DESC" : "ASC");
    }, [acoSorting]);

    const logs = useQuery<IListAuditLogsResponse, IListAuditLogsVariablesPartial>(LIST_AUDIT_LOGS, {
        variables,
        fetchPolicy: "network-only"
    });

    const records = useMemo((): IAuditLog[] => {
        if (!logs.data?.auditLogs.listAuditLogs.data) {
            return [];
        }
        const items = listAuditLogsSchema.safeParse(logs.data.auditLogs.listAuditLogs.data);
        if (!items.success) {
            console.error(items.error);
            return [];
        }
        return items.data.map(auditLog => {
            return transformRawAuditLog({
                auditLog
            });
        });
    }, [logs.data?.auditLogs]);
    const meta = useMemo(() => {
        if (!logs.data?.auditLogs.listAuditLogs.meta) {
            return {
                hasMoreItems: false,
                cursor: null
            };
        }
        return logs.data.auditLogs.listAuditLogs.meta;
    }, [logs.data?.auditLogs]);

    const sorting = useMemo((): Sorting => {
        return [
            {
                id: "createdOn",
                desc: variables.sort === "DESC"
            }
        ];
    }, [variables.sort]);

    return {
        isListLoading: logs.loading,
        records,
        meta,
        listMoreRecords: () => {
            setAfter(meta.cursor || undefined);
        },
        setWhere,
        sorting,
        setSorting: setAcoSorting,
        setLimit,
        isListLoadingMore: logs.loading && !!variables.after,
        showingFilters,
        showFilters: () => {
            setShowingFilters(true);
        },
        hideFilters: () => {
            setShowingFilters(false);
        }
    };
};
