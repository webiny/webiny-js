import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as CollapseIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { ToolTrace } from "./ToolTrace.js";
import { FollowUps } from "./FollowUps.js";
import { AiAnswer } from "./AiAnswer.js";
import { ApprovalPlan } from "./ApprovalPlan.js";
import { AskerInitials } from "./AskerInitials.js";

export interface AiTurnProps {
    turn: AiTurnViewModel;
    initials: string;
    /** Follow-ups only make sense as the next thing to ask, so older turns drop theirs. */
    latest: boolean;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
    onAsk: (question: string) => void;
    /** Set on an earlier turn the user opened again, so it can be shrunk back to one line. */
    onCollapse?: () => void;
}

/*
 * One question and its answer, as a result in the palette rather than a message in a chat: the
 * question reads as a heading, the answer and the tools it ran sit under it in a grey box, and what
 * to ask next follows the box. The palette is for a quick ask; a longer conversation belongs in the
 * chats panel.
 */
export const AiTurn = ({
    turn,
    initials,
    latest,
    busy,
    onApprove,
    onReject,
    onAsk,
    onCollapse
}: AiTurnProps) => {
    const showFollowUps =
        latest && turn.settled && !turn.error && turn.pendingApprovals.length === 0;

    return (
        <div className="px-sm py-sm">
            <div className="flex items-center gap-sm">
                <AskerInitials initials={initials} />
                <Text
                    as="div"
                    size="md"
                    className="min-w-0 flex-1 font-semibold text-neutral-primary"
                >
                    {turn.question}
                </Text>
                {onCollapse ? (
                    <button
                        type="button"
                        onClick={onCollapse}
                        aria-expanded={true}
                        className="grid size-lg shrink-0 cursor-pointer place-items-center rounded-md transition-colors duration-150 hover:bg-neutral-light focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed"
                    >
                        <Icon
                            icon={<CollapseIcon />}
                            size="sm"
                            label="Hide answer"
                            color="neutral-light"
                        />
                    </button>
                ) : null}
            </div>

            {/* The answer, any plan waiting for approval and the tools it ran, in one grey box. */}
            <div className="mt-sm rounded-lg bg-neutral-subtle p-md">
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
            </div>

            {showFollowUps ? (
                <FollowUps questions={turn.followUps} disabled={busy} onAsk={onAsk} />
            ) : null}
        </div>
    );
};
