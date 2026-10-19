import React from "react";
import { Text } from "@webiny/admin-ui";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { AiAnswer } from "~/CommandPalette/components/index.js";
import { ApprovalPlan } from "~/CommandPalette/components/index.js";
import { ToolTrace } from "~/CommandPalette/components/index.js";
import { AssistantBubble } from "./AssistantBubble.js";

export interface ChatTurnProps {
    turn: AiTurnViewModel;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}

/**
 * One question and its answer, as messages in a chat: the question on the right, the answer in the
 * assistant's bubble under it. The answer itself renders as it does in the palette.
 *
 * Follow-ups are not here. The panel shows the newest turn's above the input, where the design puts
 * suggestions, rather than under every answer.
 */
export const ChatTurn = ({ turn, busy, onApprove, onReject }: ChatTurnProps) => (
    <div className="flex flex-col gap-sm">
        <div className="ml-auto max-w-[85%] rounded-lg bg-neutral-light px-md py-sm">
            <Text as="div" size="md" className="whitespace-pre-wrap text-neutral-primary">
                {turn.question}
            </Text>
        </div>
        <AssistantBubble>
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
        </AssistantBubble>
    </div>
);
