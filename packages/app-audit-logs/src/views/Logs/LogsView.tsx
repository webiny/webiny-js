import React, { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { i18n } from "@webiny/app/i18n";
import EmptyView from "@webiny/app-admin/components/EmptyView.js";
import { useSecurity } from "@webiny/app-security";
import { Scrollbar } from "@webiny/ui/Scrollbar/index.js";
import { LoadingMore } from "~/views/Logs/LoadingMore/index.js";
import { LoadMoreButton } from "~/views/Logs/LoadMoreButton/index.js";
import { Header } from "~/views/Logs/Header/index.js";
import { Filters } from "~/views/Logs/Filters/index.js";
import { Table } from "~/views/Logs/Table/index.js";
import { Preview } from "~/views/Logs/Preview/index.js";
import { useAuditLogsList } from "~/hooks/index.js";
import { MainContainer, Wrapper } from "./styled.js";
import type { IAuditLog } from "~/types.js";

const t = i18n.ns("app-audit-logs/views/logs");

export const LogsView = () => {
    const [selectedAuditLog, setSelectedAuditLog] = useState<IAuditLog | null>(null);
    const handleAuditLogSelect = useCallback(
        (auditLog: IAuditLog) => setSelectedAuditLog(auditLog),
        []
    );
    const closePreviewModal = useCallback(() => setSelectedAuditLog(null), []);

    const { innerHeight: windowHeight } = window;
    const [tableHeight, setTableHeight] = useState(0);
    const tableRef = useRef<HTMLDivElement>(null);
    const { getPermissions } = useSecurity();
    const hasAccessToUsers = Boolean(getPermissions("adminUsers").length);

    const list = useAuditLogsList();

    useEffect(() => {
        setTableHeight(tableRef?.current?.clientHeight || 0);

        return () => {
            setTableHeight(0);
        };
    });

    const loadMoreOnScroll = debounce(({ scrollFrame }) => {
        if (scrollFrame.top > 0.8) {
            list.listMoreRecords();
        }
    }, 200);

    return (
        <>
            <MainContainer>
                <Header
                    title="Audit Logs"
                    showingFilters={list.showingFilters}
                    showFilters={list.showFilters}
                    hideFilters={list.hideFilters}
                />
                <Wrapper>
                    <Filters showingFilters={list.showingFilters} setWhere={list.setWhere} />
                    {list.records.length === 0 && !list.isListLoading ? (
                        <EmptyView title={t`No results found.`} action={null} />
                    ) : (
                        <>
                            <Preview
                                auditLog={selectedAuditLog}
                                onClose={() => closePreviewModal()}
                                hasAccessToUsers={hasAccessToUsers}
                            />
                            <Scrollbar
                                data-testid="default-data-list"
                                onScrollFrame={scrollFrame => loadMoreOnScroll({ scrollFrame })}
                            >
                                <Table
                                    ref={tableRef}
                                    records={list.records}
                                    loading={list.isListLoading}
                                    handleRecordSelect={handleAuditLogSelect}
                                    sorting={list.sorting}
                                    onSortingChange={list.setSorting}
                                    hasAccessToUsers={hasAccessToUsers}
                                />
                                <LoadMoreButton
                                    show={!list.isListLoading && list.meta.hasMoreItems}
                                    disabled={list.isListLoadingMore}
                                    windowHeight={windowHeight}
                                    tableHeight={tableHeight}
                                    onClick={list.listMoreRecords}
                                />
                            </Scrollbar>
                            {list.isListLoadingMore && <LoadingMore />}
                        </>
                    )}
                </Wrapper>
            </MainContainer>
        </>
    );
};
