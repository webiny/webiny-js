import React, { useMemo, useState } from "react";
import { Button } from "@webiny/admin-ui";
import { DataTable } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { DataTableColumns } from "@webiny/admin-ui";
import type { DataTableColumnVisibility } from "@webiny/admin-ui";
import type { OnDataTableSortingChange } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import type { ReviewListRowVm } from "../abstractions.js";
import { getClickedReviewListSortField } from "../getClickedReviewListSortField.js";
import { toReviewListTableSorting } from "../toReviewListTableSorting.js";
import { ReviewListContentTypeCell } from "./ReviewListContentTypeCell.js";
import { ReviewListNameCell } from "./ReviewListNameCell.js";
import { ReviewListRowActions } from "./ReviewListRowActions.js";
import { ReviewListWorkflowCell } from "./ReviewListWorkflowCell.js";

export interface ReviewListTableProps {
    presenter: ReviewListPresenter.Interface;
    showContentType: boolean;
}

// A row as `DataTable` takes it: the row view model with the `id` the table keys rows by.
interface ReviewListTableEntry extends ReviewListRowVm {
    id: string;
}

export const ReviewListTable = createReactiveComponent((props: ReviewListTableProps) => {
    const { presenter, showContentType } = props;
    const vm = presenter.vm;
    const [columnVisibility, setColumnVisibility] = useState<DataTableColumnVisibility>({});

    // Design order: Name, Content type, Requested by, Modified, Workflow. The resizable columns share
    // the width by their `size`; Workflow keeps a fixed width that fits its two tags. `DataTable`
    // puts the sort arrow at the end of the header, so a narrow Modified keeps it near the label.
    const columns = useMemo(() => {
        const result: DataTableColumns<ReviewListTableEntry> = {
            title: {
                header: "Name",
                cell: row => <ReviewListNameCell row={row} />,
                enableSorting: true,
                enableHiding: false,
                size: 400
            }
        };
        if (showContentType) {
            result.contentTypeLabel = {
                header: "Content type",
                cell: row => <ReviewListContentTypeCell row={row} />,
                size: 160
            };
        }
        result.requesterName = {
            header: "Requested by",
            cell: row => row.requesterName,
            size: 160
        };
        result.lastChange = {
            header: "Modified",
            cell: row => row.lastChange,
            enableSorting: true,
            size: 110
        };
        result.stepTitle = {
            header: "Workflow",
            cell: row => <ReviewListWorkflowCell row={row} />,
            truncate: false,
            enableResizing: false,
            size: 224
        };
        result.actions = {
            header: "",
            cell: row => <ReviewListRowActions row={row} presenter={presenter} />,
            enableSorting: false,
            enableHiding: false,
            enableResizing: false,
            truncate: false,
            size: 64
        };
        return result;
    }, [presenter, showContentType]);

    const data = useMemo(() => {
        return vm.rows.map(row => ({ ...row, id: row.reviewId }));
    }, [vm.rows]);

    // A changed row stands out the way a selected one does; the list has no row selection.
    const highlightedRows = useMemo(() => {
        return data.filter(row => row.highlighted);
    }, [data]);

    const sorting = useMemo(() => toReviewListTableSorting(vm.sort), [vm.sort]);

    // The list sorts on the server, one column at a time, ascending or descending, never unsorted.
    const onSortingChange: OnDataTableSortingChange = updater => {
        const next = typeof updater === "function" ? updater(sorting) : updater;
        const field = getClickedReviewListSortField(sorting, next);
        if (field) {
            void presenter.toggleSort(field);
        }
    };

    // The same bar as the CMS entry list (app-admin ListView.BottomBar); the API gives no total.
    const shownLabel = vm.rows.length === 1 ? "review" : "reviews";
    const shownText = `Showing ${vm.rows.length} ${shownLabel}.`;

    let loadMore: React.ReactNode = null;
    if (vm.hasMore) {
        loadMore = (
            <Button
                variant="tertiary"
                size="sm"
                text={vm.loadingMore ? "Loading…" : "Load more"}
                disabled={vm.loadingMore}
                onClick={() => presenter.loadMore()}
            />
        );
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={data}
                sorting={sorting}
                onSortingChange={onSortingChange}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                selectedRows={highlightedRows}
                stickyHeader={true}
            />
            <div data-role="review-list-footer">
                <Separator />
                <div className="h-xl px-md py-sm flex items-center justify-between">
                    <Text size="sm" as="div">
                        {shownText}
                    </Text>
                    {loadMore}
                </div>
            </div>
        </>
    );
});
