import React, { useMemo } from "react";
import { Button, DataTable, OverlayLoader } from "@webiny/admin-ui";
import type { DataTableColumns } from "@webiny/admin-ui";
import { Date } from "@webiny/ui/DateTime/index.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import { useCompareEntryRevisions } from "./useCompareEntryRevisions.js";
import { CompareRevisionItem } from "./CompareRevisionItem.js";
import type { CmsContentEntryRevision } from "~/types.js";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

export const CompareRevisionsTable = () => {
    const { entry, revisions, loading } = ContentEntryEditorConfig.ContentEntry.useContentEntry();
    const { selectedRevisions, canCompare, openComparisonDialog } = useCompareEntryRevisions();

    // Debug: Log the revision data structure
    console.log('CompareRevisionsTable - revisions:', revisions);
    if (revisions && revisions.length > 0) {
        console.log('CompareRevisionsTable - first revision:', revisions[0]);
        console.log('CompareRevisionsTable - first revision keys:', Object.keys(revisions[0]));
    }

    const columns: DataTableColumns<CmsContentEntryRevision> = useMemo(
        () => ({
            id: {
                header: "Select",
                cell: (revision) => {
                    console.log('Select cell - revision:', revision);
                    return <CompareRevisionItem revision={revision} />;
                },
                enableSorting: false,
                size: 80
            },
            version: {
                header: "Version",
                cell: (revision) => {
                    console.log('Version cell - revision:', revision);
                    // Based on the console log, the revision object has properties directly
                    // Let's check what version-related properties exist
                    const versionInfo = revision.version || revision.meta?.version || revision.id?.split('#')[1];
                    console.log('Version cell - versionInfo:', versionInfo);
                    return versionInfo ? `#${versionInfo}` : "No version";
                },
                size: 100
            },
            title: {
                header: "Title",
                cell: (revision) => {
                    // Check various possible title properties
                    const title = revision.title || revision.meta?.title || revision.values?.title;
                    return title || t`N/A`;
                },
                size: 200
            },
            status: {
                header: "Status",
                cell: (revision) => {
                    const status = revision.status || revision.meta?.status;
                    return (
                        <span
                            className={`wby-capitalize wby-px-2 wby-py-1 wby-rounded wby-text-xs ${
                                status === "published"
                                    ? "wby-bg-green-100 wby-text-green-800"
                                    : revision.locked || revision.meta?.locked
                                        ? "wby-bg-yellow-100 wby-text-yellow-800"
                                        : "wby-bg-gray-100 wby-text-gray-800"
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
                cell: (revision) => {
                    const author = revision.savedBy?.displayName || revision.createdBy?.displayName || revision.revisionCreatedBy?.displayName;
                    return author || t`N/A`;
                },
                size: 150
            },
            modifiedOn: {
                header: "Modified On",
                cell: (revision) => {
                    const date = revision.savedOn || revision.modifiedOn || revision.revisionSavedOn;
                    return date ? <Date date={date} /> : t`N/A`;
                },
                size: 180
            }
        }),
        []
    );

    if (!entry?.id || !revisions?.length) {
        return (
            <div className={"wby-p-lg wby-text-center"}>
                {loading ? <OverlayLoader /> : t`No revisions to compare.`}
            </div>
        );
    }

    return (
        <div className={"wby-relative"}>
            {loading && <OverlayLoader />}

            <div className={"wby-p-lg wby-border-b wby-border-gray-200"}>
                <div className={"wby-flex wby-items-center wby-justify-between"}>
                    <div>
                        <h3 className={"wby-text-lg wby-font-semibold wby-mb-1"}>
                            Select two revisions to compare
                        </h3>
                        <p className={"wby-text-sm wby-text-gray-600"}>
                            {selectedRevisions?.length === 0 && "Choose two revisions to see their differences"}
                            {selectedRevisions?.length === 1 && "Select one more revision to compare"}
                            {selectedRevisions?.length === 2 &&
                                `Comparing version #${selectedRevisions[0]?.meta?.version ?? "—"} with version #${selectedRevisions[1]?.meta?.version ?? "—"}`}
                            {selectedRevisions?.length > 2 && "Too many revisions selected. Please select only two."}
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

            <div className={"wby-p-lg"}>
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