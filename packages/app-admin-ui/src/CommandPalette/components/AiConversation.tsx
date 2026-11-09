import React from "react";
import { useState } from "react";
import { Separator } from "@webiny/admin-ui";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { AiTurn } from "./AiTurn.js";
import { CollapsedTurn } from "./CollapsedTurn.js";

export interface AiConversationProps {
    turns: AiTurnViewModel[];
    initials: string;
    busy: boolean;
    onApprove: (turnIndex: number) => void;
    onReject: (turnIndex: number) => void;
    onAsk: (question: string) => void;
    onRetry: () => void;
    onChooseModel?: () => void;
    settingsPath?: string[];
}

/**
 * The palette's turns, newest first.
 *
 * The palette is a quick ask, not a chat. The newest answer sits right under the input, where the
 * next question is typed, and every earlier turn shrinks to one line. A click opens an earlier turn
 * again, and one still waiting on an approval stays open, since its Run button has to stay in reach.
 */
export const AiConversation = ({
    turns,
    initials,
    busy,
    onApprove,
    onReject,
    onAsk,
    onRetry,
    onChooseModel,
    settingsPath
}: AiConversationProps) => {
    // Indexes of earlier turns the user opened again. The newest is always open.
    const [opened, setOpened] = useState<Set<number>>(new Set());
    const newest = turns.length - 1;

    /*
     * Each open turn is a block of its own, and a run of collapsed turns is one block, with a rule
     * between blocks. The palette adds the "Continue in AI chats" strip after the last one.
     */
    const blocks: React.ReactNode[] = [];
    let collapsed: React.ReactNode[] = [];
    const flushCollapsed = () => {
        if (collapsed.length > 0) {
            blocks.push(
                <div key={`collapsed-${blocks.length}`} className="flex flex-col gap-xxs">
                    {collapsed}
                </div>
            );
            collapsed = [];
        }
    };

    for (let index = newest; index >= 0; index--) {
        const turn = turns[index];
        const pinnedOpen = index === newest || turn.pendingApprovals.length > 0;
        const open = pinnedOpen || opened.has(index);

        if (!open) {
            collapsed.push(
                <CollapsedTurn
                    key={index}
                    turn={turn}
                    onExpand={() => setOpened(new Set(opened).add(index))}
                />
            );
            continue;
        }

        // A turn the user opened again can be shrunk back; the newest and a pending one cannot.
        let collapse: (() => void) | undefined;
        if (!pinnedOpen) {
            collapse = () => {
                const next = new Set(opened);
                next.delete(index);
                setOpened(next);
            };
        }

        flushCollapsed();
        blocks.push(
            <AiTurn
                key={index}
                turn={turn}
                initials={initials}
                latest={index === newest}
                busy={busy}
                onApprove={() => onApprove(index)}
                onReject={() => onReject(index)}
                onAsk={onAsk}
                onCollapse={collapse}
                onRetry={onRetry}
                onChooseModel={onChooseModel}
                settingsPath={settingsPath}
            />
        );
    }
    flushCollapsed();

    const separated: React.ReactNode[] = [];
    blocks.forEach((block, index) => {
        if (index > 0) {
            separated.push(<Separator key={`separator-${index}`} variant="dimmed" />);
        }
        separated.push(block);
    });

    return <>{separated}</>;
};
