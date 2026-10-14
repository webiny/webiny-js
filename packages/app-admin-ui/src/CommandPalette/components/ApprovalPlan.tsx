import React from "react";
import { Button } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import { ReactComponent as StepIcon } from "@webiny/icons/subdirectory_arrow_right.svg";
import type { AdminAssistantPendingApproval } from "@webiny/app-admin";

export interface ApprovalPlanProps {
    approvals: AdminAssistantPendingApproval[];
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}

/**
 * One line per argument, in the order the model sent them. Strings unquoted, anything else as JSON.
 * A tool that takes no arguments gets no lines: its input arrives as `undefined` or `{}`.
 */
const toArgumentLines = (input: unknown): string[] => {
    if (input === undefined || input === null) {
        return [];
    }

    if (typeof input !== "object" || Array.isArray(input)) {
        return [JSON.stringify(input)];
    }

    return Object.entries(input as Record<string, unknown>).map(([key, value]) => {
        const shown = typeof value === "string" ? value : JSON.stringify(value);
        return `${key}: ${shown}`;
    });
};

/**
 * The confirm gate for a proposed change.
 *
 * Each step shows the tool's arguments exactly as it will receive them, not a summary. A prose summary
 * would be the assistant describing its own request, and the assistant is exactly what is not yet
 * trusted here. What the user approves has to be what actually runs.
 */
export const ApprovalPlan = ({ approvals, busy, onApprove, onReject }: ApprovalPlanProps) => {
    if (approvals.length === 0) {
        return null;
    }

    const destructive = approvals.some(approval => approval.destructive);

    // The steps name the tools, so the heading says what is being asked of the user instead.
    const heading =
        approvals.length === 1 ? "Approve this change" : `Approve ${approvals.length} changes`;

    return (
        <div
            className={cn(
                "mt-sm overflow-hidden rounded-md border first:mt-0",
                destructive ? "border-destructive-subtle" : "border-warning-muted"
            )}
        >
            <div
                className={cn(
                    "flex items-center gap-sm border-b px-sm py-xs-plus",
                    destructive
                        ? "border-destructive-subtle bg-destructive-subtle"
                        : "border-warning-muted bg-warning-subtle"
                )}
            >
                <Icon
                    icon={destructive ? <WarningIcon /> : <BoltIcon />}
                    size="sm"
                    label=""
                    color="inherit"
                    className={destructive ? "text-destructive-primary" : "text-warning-strong"}
                />
                <Text size="sm" className="font-semibold text-neutral-primary">
                    {heading}
                </Text>
                {destructive ? (
                    <Text size="sm" className="ml-auto text-destructive-primary">
                        Cannot be undone
                    </Text>
                ) : null}
            </div>

            <div className="bg-neutral-base px-sm py-sm">
                {approvals.map(approval => (
                    <div key={approval.approvalId} className="mb-sm flex items-start gap-sm">
                        <Icon
                            icon={<StepIcon />}
                            size="sm"
                            label=""
                            color="neutral-light"
                            className="mt-xxs"
                        />
                        <div className="min-w-0 flex-1">
                            <Text as="div" size="md" className="text-neutral-primary">
                                {approval.title ?? approval.toolName}
                            </Text>
                            {toArgumentLines(approval.input).map((line, index) => (
                                <Text
                                    key={index}
                                    as="div"
                                    size="sm"
                                    className="break-all font-mono text-neutral-muted"
                                >
                                    {line}
                                </Text>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="flex items-center gap-sm">
                    <Button variant="primary" text="Run" disabled={busy} onClick={onApprove} />
                    <Button variant="tertiary" text="Reject" disabled={busy} onClick={onReject} />
                    <Text size="sm" className="text-neutral-muted">
                        Nothing runs until you confirm.
                    </Text>
                </div>
            </div>
        </div>
    );
};
