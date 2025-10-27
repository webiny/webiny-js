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
                            className={`wby-capitalize wby-px-2 wby-py-1 wby-rounded wby-text-xs ${
                                status === "published"
                                    ? "wby-bg-green-100 wby-text-green-800"
                                    : revision.meta?.locked
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
