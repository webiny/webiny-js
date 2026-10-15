import React, { useState } from "react";
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
    onAsk
}: AiConversationProps) => {
    // Indexes of earlier turns the user opened again. The newest is always open.
    const [opened, setOpened] = useState<Set<number>>(new Set());
    const newest = turns.length - 1;

    return (
        <div className="flex flex-col">
            {turns
                .map((turn, index) => ({ turn, index }))
                .reverse()
                .map(({ turn, index }) => {
                    const pinnedOpen = index === newest || turn.pendingApprovals.length > 0;
                    const open = pinnedOpen || opened.has(index);

                    if (!open) {
                        return (
                            <CollapsedTurn
                                key={index}
                                turn={turn}
                                onExpand={() => setOpened(new Set(opened).add(index))}
                            />
                        );
                    }

                    return (
                        <div
                            key={index}
                            className="border-b border-neutral-subtle pb-xs last:border-b-0"
                        >
                            <AiTurn
                                turn={turn}
                                initials={initials}
                                latest={index === newest}
                                busy={busy}
                                onApprove={() => onApprove(index)}
                                onReject={() => onReject(index)}
                                onAsk={onAsk}
                                onCollapse={
                                    pinnedOpen
                                        ? undefined
                                        : () => {
                                              const next = new Set(opened);
                                              next.delete(index);
                                              setOpened(next);
                                          }
                                }
                            />
                        </div>
                    );
                })}
        </div>
    );
};
