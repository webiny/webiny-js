import React from "react";
import { cn } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { useAdminUi } from "@webiny/admin-ui";
import type { AiTurn as AiTurnModel } from "../useAiChat.js";
import { ToolChip } from "./ToolChip.js";
import { AnswerSkeleton } from "./AnswerSkeleton.js";
import { ApprovalPlan } from "./ApprovalPlan.js";

/**
 * Tailwind's preflight strips list markers and paragraph margins, so markdown blocks need explicit
 * styling. Scoped to the answer rather than added globally.
 */
const MARKDOWN_CLASSES = [
    "[&_p]:mb-xs [&_p:last-child]:mb-0",
    "[&_ul]:mb-xs [&_ul]:list-disc [&_ul]:pl-lg",
    "[&_ol]:mb-xs [&_ol]:list-decimal [&_ol]:pl-lg",
    "[&_li]:mt-xxs",
    "[&_strong]:font-semibold",
    "[&_a]:underline",
    "[&_code]:rounded [&_code]:bg-neutral-subtle [&_code]:px-xs [&_code]:font-mono",
    "[&_pre]:mb-xs [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-neutral-subtle [&_pre]:p-sm"
].join(" ");

export interface AiTurnProps {
    turn: AiTurnModel;
    /** Initials of the signed-in user, shown against their question. */
    initials: string;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}

export const AiTurn = ({ turn, initials, busy, onApprove, onReject }: AiTurnProps) => {
    const { compileMarkdown } = useAdminUi();
    const settled = Boolean(turn.result || turn.error);
    const toolNames = turn.result?.toolCalls.map(call => call.name) ?? [];

    return (
        <div className="mb-md">
            <div className="flex items-start gap-sm px-sm pb-sm">
                <span className="mt-xxs grid size-md shrink-0 place-items-center rounded-xl bg-neutral-dimmed">
                    <Text size="sm" className="text-xs font-bold text-neutral-strong">
                        {initials}
                    </Text>
                </span>
                <Text as="div" size="md" className="font-semibold text-neutral-primary">
                    {turn.question}
                </Text>
            </div>

            <div className="px-sm">
                {!settled ? (
                    <AnswerSkeleton />
                ) : turn.error ? (
                    <Text as="div" size="sm" className="text-destructive-primary">
                        {turn.error}
                    </Text>
                ) : turn.result?.text ? (
                    // `as="div"` so block-level markdown (p, ul, pre) nests legally — Text is a span.
                    <Text
                        as="div"
                        size="sm"
                        className={cn("text-neutral-strong", MARKDOWN_CLASSES)}
                    >
                        {compileMarkdown(turn.result.text)}
                    </Text>
                ) : (
                    <Text as="div" size="sm" className="text-neutral-muted">
                        No answer returned.
                    </Text>
                )}

                {turn.result?.pendingApprovals.length ? (
                    <ApprovalPlan
                        approvals={turn.result.pendingApprovals}
                        busy={busy}
                        onApprove={onApprove}
                        onReject={onReject}
                    />
                ) : null}

                {settled && toolNames.length > 0 ? (
                    <div className="mt-sm flex flex-wrap items-center gap-xs">
                        <Text size="sm" className="text-xs text-neutral-muted">
                            Ran
                        </Text>
                        {toolNames.map((name, index) => (
                            <ToolChip key={`${name}-${index}`} name={name} state="done" />
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
};
