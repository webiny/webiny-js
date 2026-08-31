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

    /*
     * Show the skeleton only until the first token lands. Once text is arriving, the text itself is
     * the progress indicator — swapping a skeleton in and out under it would flicker.
     */
    const showSkeleton = !turn.text && !turn.error && !turn.settled;

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
                {turn.tools.length > 0 ? (
                    <div className="mb-sm flex flex-wrap items-center gap-xs">
                        {turn.tools.map((name, index) => (
                            <ToolChip
                                key={`${name}-${index}`}
                                name={name}
                                state={
                                    turn.running && index === turn.tools.length - 1
                                        ? "running"
                                        : "done"
                                }
                            />
                        ))}
                    </div>
                ) : null}

                {turn.error ? (
                    <Text as="div" size="sm" className="text-destructive-primary">
                        {turn.error}
                    </Text>
                ) : showSkeleton ? (
                    <AnswerSkeleton />
                ) : turn.text ? (
                    // `as="div"` so block-level markdown (p, ul, pre) nests legally — Text is a span.
                    <Text
                        as="div"
                        size="sm"
                        className={cn("text-neutral-strong", MARKDOWN_CLASSES)}
                    >
                        {compileMarkdown(turn.text)}
                    </Text>
                ) : turn.pendingApprovals.length === 0 ? (
                    <Text as="div" size="sm" className="text-neutral-muted">
                        No answer returned.
                    </Text>
                ) : null}

                {turn.pendingApprovals.length > 0 ? (
                    <ApprovalPlan
                        approvals={turn.pendingApprovals}
                        busy={busy}
                        onApprove={onApprove}
                        onReject={onReject}
                    />
                ) : null}
            </div>
        </div>
    );
};
