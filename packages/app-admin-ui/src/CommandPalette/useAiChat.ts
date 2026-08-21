import { useCallback, useState } from "react";
import { useContainer } from "@webiny/app";
import { AiChatGateway } from "@webiny/app-admin";
import type { AiChatMessage, AiChatResult } from "@webiny/app-admin";

export interface AiTurn {
    question: string;
    result?: AiChatResult;
    error?: string;
}

export interface UseAiChat {
    turns: AiTurn[];
    busy: boolean;
    ask(question: string): void;
    /** Approve or reject the calls the server paused on for a given turn. */
    decide(turnIndex: number, approved: boolean): void;
    reset(): void;
}

/**
 * Owns the AI conversation for the palette.
 *
 * State lives here rather than in a command's detail view because the design keeps ONE input row
 * across every mode — the palette itself renders the conversation, so it has to own it.
 */
export const useAiChat = (): UseAiChat => {
    const container = useContainer();
    const [turns, setTurns] = useState<AiTurn[]>([]);
    const [busy, setBusy] = useState(false);

    /** Replays settled turns so follow-ups ("and which of those is cheapest?") have context. */
    const historyBefore = useCallback(
        (upTo: number): AiChatMessage[] =>
            turns
                .slice(0, upTo)
                .flatMap(turn =>
                    turn.result
                        ? [{ role: "user", content: turn.question }, ...turn.result.messages]
                        : []
                ),
        [turns]
    );

    const settleAt = useCallback(
        (index: number, patch: Partial<AiTurn>) =>
            setTurns(current =>
                current.map((turn, i) => (i === index ? { ...turn, ...patch } : turn))
            ),
        []
    );

    const ask = useCallback(
        (question: string) => {
            const trimmed = question.trim();
            if (!trimmed || busy) {
                return;
            }

            const index = turns.length;
            setBusy(true);
            setTurns(current => [...current, { question: trimmed }]);

            container
                .resolve(AiChatGateway)
                .execute({
                    messages: [...historyBefore(index), { role: "user", content: trimmed }]
                })
                .then(result => settleAt(index, { result }))
                .catch(error =>
                    settleAt(index, {
                        error: error instanceof Error ? error.message : String(error)
                    })
                )
                .finally(() => setBusy(false));
        },
        [busy, container, historyBefore, settleAt, turns.length]
    );

    const decide = useCallback(
        (turnIndex: number, approved: boolean) => {
            const turn = turns[turnIndex];
            if (!turn?.result?.pendingApprovals.length || busy) {
                return;
            }

            const pending = turn.result.pendingApprovals;

            // The paused assistant message must be replayed unchanged — the approval request lives only
            // in `result.messages`, so resuming means sending the same history back plus the decision.
            const messages: AiChatMessage[] = [
                ...historyBefore(turnIndex),
                { role: "user", content: turn.question },
                ...turn.result.messages
            ];

            setBusy(true);
            // Clear the pending block immediately so the plan cannot be double-submitted.
            settleAt(turnIndex, {
                result: { ...turn.result, pendingApprovals: [] }
            });

            container
                .resolve(AiChatGateway)
                .execute({
                    messages,
                    approvals: pending.map(approval => ({
                        approvalId: approval.approvalId,
                        approved
                    }))
                })
                .then(result => settleAt(turnIndex, { result }))
                .catch(error =>
                    settleAt(turnIndex, {
                        error: error instanceof Error ? error.message : String(error)
                    })
                )
                .finally(() => setBusy(false));
        },
        [busy, container, historyBefore, settleAt, turns]
    );

    const reset = useCallback(() => {
        setTurns([]);
        setBusy(false);
    }, []);

    return { turns, busy, ask, decide, reset };
};
