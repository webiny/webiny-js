import React, { useEffect, useState } from "react";
import { OverlayLoader, Alert } from "@webiny/admin-ui";
import { Date } from "@webiny/ui/DateTime/index.js";
import { useQuery } from "~/admin/hooks/index.js";
import { gql } from "graphql-tag";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";
import type { CmsContentEntryRevision } from "~/types.js";


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
        <>
            <style>{`
                .comparison-report {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 100%;
                    overflow-x: auto;
                }

                .comparison-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    border-radius: 0.5rem;
                    overflow: hidden;
                    table-layout: fixed;
                }

                .comparison-table thead {
                    background-color: #f8fafc;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .comparison-table th {
                    padding: 0.75rem 0.5rem;
                    text-align: left;
                    font-weight: 600;
                    color: #374151;
                    border-bottom: 2px solid #e5e7eb;
                    font-size: 0.875rem;
                    white-space: nowrap;
                }

                .comparison-table th:first-child {
                    width: 15%;
                    min-width: 120px;
                }

                .comparison-table th:nth-child(2),
                .comparison-table th:nth-child(3) {
                    width: 30%;
                    min-width: 200px;
                }

                .comparison-table th:last-child {
                    width: 25%;
                    min-width: 180px;
                }

                .comparison-table td {
                    padding: 0.75rem 0.5rem;
                    border-bottom: 1px solid #f3f4f6;
                    vertical-align: top;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    hyphens: auto;
                    max-width: 0;
                }

                .comparison-table tr:hover {
                    background-color: #f9fafb;
                }

                .comparison-table tr:last-child td {
                    border-bottom: none;
                }

                .comparison-table strong {
                    color: #1f2937;
                    font-weight: 600;
                    display: block;
                    margin-bottom: 0.25rem;
                }

                @media (max-width: 1024px) {
                    .comparison-table th:first-child {
                        width: 20%;
                    }

                    .comparison-table th:nth-child(2),
                    .comparison-table th:nth-child(3) {
                        width: 35%;
                    }

                    .comparison-table th:last-child {
                        width: 10%;
                    }

                    .comparison-table th,
                    .comparison-table td {
                        padding: 0.5rem 0.25rem;
                        font-size: 0.8rem;
                    }
                }
            `}</style>
            <div className={"wby-space-y-6"}>
            {/* Revision Headers */}
            <div className={"wby-grid wby-grid-cols-2 wby-gap-6 wby-pb-4 wby-border-b wby-border-gray-200"}>
                <div className={"wby-space-y-2"}>
                    <h3 className={"wby-text-lg wby-font-semibold wby-text-blue-600"}>
                        Version #{revision1.meta.version}
                    </h3>
                    <div className={"wby-text-md wby-text-gray-600"}>
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
                    <div className={"wby-text-md wby-text-gray-600"}>
                        <div><strong>Title:</strong> {revision2.meta.title || "N/A"}</div>
                        <div><strong>Status:</strong> {revision2.meta.status}</div>
                        <div><strong>Modified by:</strong> {revision2.revisionCreatedBy?.displayName || "N/A"}</div>
                        <div><strong>Modified on:</strong> <Date date={revision2.revisionSavedOn} /></div>
                    </div>
                </div>
            </div>

            {/* Comparison Results */}
            <div className={"wby-space-y-4"}>

                {comparisonHtml ? (
                    <div
                        className={"wby-prose wby-max-w-none"}
                        style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            lineHeight: '1.6',
                            color: '#333',
                            maxWidth: '100%',
                            overflowX: 'auto'
                        }}
                        dangerouslySetInnerHTML={{ __html: comparisonHtml }}
                    />
                ) : (
                    <div className={"wby-text-center wby-py-8 wby-text-gray-500"}>
                        No differences found between these revisions.
                    </div>
                )}
            </div>
            </div>
        </>
    );
};
