import React, { useEffect, useState } from "react";
import { OverlayLoader, Alert } from "@webiny/admin-ui";
import { Date } from "@webiny/ui/DateTime/index.js";
import { useQuery } from "~/admin/hooks/index.js";
import { gql } from "graphql-tag";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import type { CmsContentEntryRevision } from "~/types.js";
// import "./CompareRevisions.css";

const COMPARE_REVISIONS = gql`
    query CompareEntryRevisions($input: CompareRevisionsInput!) {
        compareEntryRevisions(input: $input) {
            html
            summary
        }
    }
`;

interface CompareRevisionsContentProps {
    revision1: CmsContentEntryRevision;
    revision2: CmsContentEntryRevision;
}

export const CompareRevisionsContent = ({ revision1, revision2 }: CompareRevisionsContentProps) => {
    const [comparisonHtml, setComparisonHtml] = useState<string>("");
    const { contentModel } = ContentEntryEditorConfig.ContentEntry.useContentEntry();

    const { data, loading, error } = useQuery(COMPARE_REVISIONS, {
        variables: {
            input: {
                revisionId1: revision1.id,
                revisionId2: revision2.id,
                modelId: contentModel.modelId
            }
        },
        fetchPolicy: "cache-and-network"
    });

    useEffect(() => {
        if (data?.compareEntryRevisions?.html) {
            setComparisonHtml(data.compareEntryRevisions.html);
        }
    }, [data]);

    if (loading) {
        return (
            <div className={"wby-relative wby-min-h-96"}>
                <OverlayLoader text={"Comparing revisions..."} />
            </div>
        );
    }

    if (error) {
        return (
            <Alert type={"danger"} title={"Comparison Error"}>
                Failed to compare revisions: {error.message}
            </Alert>
        );
    }

    return (
        <div className={"wby-space-y-6"}>
            {/* Revision Headers */}
            <div className={"wby-grid wby-grid-cols-2 wby-gap-6 wby-pb-4 wby-border-b wby-border-gray-200"}>
                <div className={"wby-space-y-2"}>
                    <h3 className={"wby-text-lg wby-font-semibold wby-text-blue-600"}>
                        Version #{revision1.meta.version}
                    </h3>
                    <div className={"wby-text-sm wby-text-gray-600"}>
                        <div><strong>Title:</strong> {revision1.meta.title || "N/A"}</div>
                        <div><strong>Status:</strong> {revision1.meta.status}</div>
                        <div><strong>Modified by:</strong> {revision1.revisionCreatedBy?.displayName || "N/A"}</div>
                        <div><strong>Modified on:</strong> <Date date={revision1.revisionSavedOn} /></div>
                    </div>
                </div>
                <div className={"wby-space-y-2"}>
                    <h3 className={"wby-text-lg wby-font-semibold wby-text-green-600"}>
                        Version #{revision2.meta.version}
                    </h3>
                    <div className={"wby-text-sm wby-text-gray-600"}>
                        <div><strong>Title:</strong> {revision2.meta.title || "N/A"}</div>
                        <div><strong>Status:</strong> {revision2.meta.status}</div>
                        <div><strong>Modified by:</strong> {revision2.revisionCreatedBy?.displayName || "N/A"}</div>
                        <div><strong>Modified on:</strong> <Date date={revision2.revisionSavedOn} /></div>
                    </div>
                </div>
            </div>

            {/* Comparison Results */}
            <div className={"wby-space-y-4"}>
                <h3 className={"wby-text-lg wby-font-semibold"}>Differences</h3>
                {comparisonHtml ? (
                    <div
                        className={"wby-prose wby-max-w-none"}
                        dangerouslySetInnerHTML={{ __html: comparisonHtml }}
                    />
                ) : (
                    <div className={"wby-text-center wby-py-8 wby-text-gray-500"}>
                        No differences found between these revisions.
                    </div>
                )}
            </div>
        </div>
    );
};
