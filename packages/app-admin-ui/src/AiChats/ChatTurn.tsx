import React from "react";
import { Text } from "@webiny/admin-ui";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { AiAnswer } from "~/CommandPalette/components/index.js";
import { ApprovalPlan } from "~/CommandPalette/components/index.js";
import { ToolTrace } from "~/CommandPalette/components/index.js";
import { AssistantMessage } from "./AssistantMessage.js";

export interface ChatTurnProps {
    turn: AiTurnViewModel;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}

/**
 * One question and its answer, as messages in a chat: the question on the right under "You", the
 * answer under the assistant's label. The answer itself renders as it does in the palette.
 *
 * Follow-ups are not here. The panel shows the newest turn's above the input, where the design puts
 * suggestions, rather than under every answer.
 */
export const ChatTurn = ({ turn, busy, onApprove, onReject }: ChatTurnProps) => (
    <div className="flex flex-col gap-lg">
        <div className="flex flex-col items-end gap-sm">
            <Text size="sm" className="text-neutral-strong">
                You
            </Text>
            <div className="max-w-[87%] rounded-xl bg-neutral-light p-md">
                <Text as="div" size="md" className="whitespace-pre-wrap text-neutral-primary">
                    {turn.question}
                </Text>
            </div>
        </div>
        {/* Copy waits for the answer to finish, so it never copies half of one. */}
        <AssistantMessage copyText={turn.settled ? turn.text : undefined}>
            <AiAnswer turn={turn} />
            {turn.pendingApprovals.length > 0 ? (
                <ApprovalPlan
                    approvals={turn.pendingApprovals}
                    busy={busy}
                    onApprove={onApprove}
                    onReject={onReject}
                />
            ) : null}
            <ToolTrace turn={turn} />
        </AssistantMessage>
    </div>
);
