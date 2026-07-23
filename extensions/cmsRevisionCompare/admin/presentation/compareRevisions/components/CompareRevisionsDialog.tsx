import React from "react";
import { createReactiveComponent } from "webiny/admin";
import { Dialog, Button, Alert } from "webiny/admin/ui";
import type { CompareRevisionsPresenter } from "../abstractions.js";

interface CompareRevisionsDialogProps {
    presenter: CompareRevisionsPresenter.Interface;
}

const COMPARISON_STYLES = `
    .comparison-report {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 100%;
        overflow-x: auto;
    }
    .comparison-report h2 {
        color: #2563eb;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        font-size: 1.5rem;
        font-weight: 700;
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
    .comparison-table th:first-child { width: 15%; min-width: 120px; }
    .comparison-table th:nth-child(2),
    .comparison-table th:nth-child(3) { width: 30%; min-width: 200px; }
    .comparison-table th:last-child { width: 25%; min-width: 180px; }
    .comparison-table td {
        padding: 0.75rem 0.5rem;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: top;
        word-wrap: break-word;
        overflow-wrap: break-word;
        max-width: 0;
    }
    .comparison-table tr:hover { background-color: #f9fafb; }
    .comparison-table tr:last-child td { border-bottom: none; }
    .comparison-table strong {
        color: #1f2937;
        font-weight: 600;
        display: block;
        margin-bottom: 0.25rem;
    }
    .comparison-table .field-changed { background-color: #fef3c7; }
    .comparison-table .field-added { background-color: #d1fae5; }
    .comparison-table .field-removed { background-color: #fee2e2; }
    .comparison-table .value-old { color: #dc2626; text-decoration: line-through; }
    .comparison-table .value-new { color: #059669; font-weight: 500; }
    .comparison-table .change-summary { font-style: italic; color: #4b5563; }
    .no-changes {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
        font-style: italic;
        background-color: #f9fafb;
        border-radius: 0.5rem;
        border: 1px dashed #d1d5db;
    }
`;

export const CompareRevisionsDialog = createReactiveComponent(
    ({ presenter }: CompareRevisionsDialogProps) => {
        const { dialogVisible, comparing, error, result } = presenter.vm;

        const renderContent = () => {
            if (error) {
                return (
                    <Alert type={"danger"} title={"Comparison Error"}>
                        {error}
                    </Alert>
                );
            }

            if (result) {
                return (
                    <>
                        <style>{COMPARISON_STYLES}</style>
                        <div
                            className={"wby-prose wby-max-w-none"}
                            dangerouslySetInnerHTML={{ __html: result.html }}
                        />
                    </>
                );
            }

            if (!comparing) {
                return (
                    <div className={"wby-text-center wby-py-lg wby-text-neutral-subtle"}>
                        No comparison data available.
                    </div>
                );
            }

            return null;
        };

        return (
            <Dialog
                open={dialogVisible}
                onOpenChange={open => {
                    if (!open) {
                        presenter.hideDialog();
                    }
                }}
                title={"Compare Revisions"}
                size={"full"}
                loading={comparing ? { text: "Comparing revisions with AI..." } : false}
                actions={
                    <Button
                        variant={"secondary"}
                        onClick={() => presenter.hideDialog()}
                        text={"Close"}
                    />
                }
                data-testid={"cms.compare-revisions.dialog"}
            >
                {renderContent()}
            </Dialog>
        );
    }
);
