import React, { useMemo } from "react";
import { Button, DataTable, OverlayLoader } from "@webiny/admin-ui";
import type { DataTableColumns } from "@webiny/admin-ui";
import { Date } from "@webiny/ui/DateTime/index.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { ContentEntryEditorConfig } from "~/ContentEntryEditorConfig.js";
import { useCompareEntryRevisions } from "./useCompareEntryRevisions.js";
import { CompareRevisionItem } from "./CompareRevisionItem.js";
import type { CmsContentEntryRevision } from "~/types.js";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

export const CompareRevisionsTable = () => {
    const { entry, revisions, loading } = ContentEntryEditorConfig.ContentEntry.useContentEntry();
    const { selectedRevisions, canCompare, openComparisonDialog } = useCompareEntryRevisions();

    const columns: DataTableColumns<CmsContentEntryRevision> = useMemo(
        () => ({
            id: {
                header: "Select",
                cell: (revision: CmsContentEntryRevision) => {
                    return <CompareRevisionItem revision={revision} />;
                },
                enableSorting: false,
                size: 80
            },
            version: {
                header: "Version",
                cell: (revision: CmsContentEntryRevision) => {
                    // CmsContentEntryRevision has meta.version property
                    const versionInfo = revision.meta?.version || revision.id?.split("#")[1];
                    return versionInfo ? `#${versionInfo}` : "No version";
                },
                size: 100
            },
            title: {
                header: "Title",
                cell: (revision: CmsContentEntryRevision) => {
                    // CmsContentEntryRevision has meta.title property
                    const title = revision.meta?.title;
                    return title || t`N/A`;
                },
                size: 200
            },
            status: {
                header: "Status",
                cell: (revision: CmsContentEntryRevision) => {
                    const status = revision.meta?.status;
                    return (
                        <span
                            className={`capitalize px-2 py-1 rounded text-xs ${
                                status === "published"
                                    ? "bg-green-100 text-green-800"
                                    : revision.meta?.locked
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                        >
                            {status ?? t`N/A`}
                        </span>
                    );
                },
                size: 120
            },
            modifiedBy: {
                header: "Modified By",
                cell: (revision: CmsContentEntryRevision) => {
                    // CmsContentEntryRevision has revisionCreatedBy and revisionSavedBy properties
                    const author =
                        revision.revisionSavedBy?.displayName ||
                        revision.revisionCreatedBy?.displayName ||
                        revision.createdBy?.displayName;
                    return author || t`N/A`;
                },
                size: 150
            },
            modifiedOn: {
                header: "Modified On",
                cell: (revision: CmsContentEntryRevision) => {
                    // CmsContentEntryRevision has savedOn and revisionSavedOn properties
                    const date = revision.savedOn || revision.revisionSavedOn;
                    return date ? <Date date={date} /> : t`N/A`;
                },
                size: 180
            }
        }),
        []
    );

    if (!entry?.id || !revisions?.length) {
        return (
            <div className={"p-lg text-center"}>
                {loading ? <OverlayLoader /> : t`No revisions to compare.`}
            </div>
        );
    }

    return (
        <div className={"relative"}>
            {loading && <OverlayLoader />}

            <div className={"p-lg border-b border-gray-200"}>
                <div className={"flex items-center justify-between"}>
                    <div>
                        <h3 className={"text-lg font-semibold mb-1"}>
                            Select two revisions to compare
                        </h3>
                        <p className={"text-sm text-gray-600"}>
                            {selectedRevisions?.length === 0 &&
                                "Choose two revisions to see their differences"}
                            {selectedRevisions?.length === 1 &&
                                "Select one more revision to compare"}
                            {selectedRevisions?.length === 2 &&
                                `Comparing version #${selectedRevisions[0]?.meta?.version ?? "—"} with version #${selectedRevisions[1]?.meta?.version ?? "—"}`}
                            {selectedRevisions?.length > 2 &&
                                "Too many revisions selected. Please select only two."}
                        </p>
                    </div>
                    <Button
                        variant={"primary"}
                        disabled={!canCompare}
                        onClick={() => openComparisonDialog(true)}
                        data-testid={"cms.compare-revisions.compare-button"}
                        text={"Compare Revisions"}
                    />
                </div>
            </div>

            <div className={"p-lg"}>
                <DataTable
                    columns={columns}
                    data={revisions}
                    loading={loading}
                    bordered={true}
                    stickyHeader={false}
                />
            </div>
        </div>
    );
};
