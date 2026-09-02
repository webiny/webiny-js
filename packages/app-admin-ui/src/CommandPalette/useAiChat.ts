import { useCallback, useEffect, useRef, useState } from "react";
import { useContainer } from "@webiny/app";
import { AiChatGateway } from "@webiny/app-admin";
import type { AiChatMessage } from "@webiny/app-admin";
import type { AiChatPendingApproval } from "@webiny/app-admin";
import type { AiChatRequest } from "@webiny/app-admin";

export interface AiTurn {
    question: string;
    /** Answer text so far. Grows as the stream arrives. */
    text: string;
    /** Tools called this turn, in call order. */
    tools: string[];
    /**
     * Tools that actually returned. A call pending approval still emits `tool-call`, so this is the
     * only way to tell a completed tool from one merely proposed.
     */
    completed: string[];
    /** Set while a tool is running and no answer text has arrived yet. */
    running: boolean;
    pendingApprovals: AiChatPendingApproval[];
    /** Server messages to replay when resuming after an approval. */
    messages: AiChatMessage[];
    settled: boolean;
    error?: string;
}

export interface UseAiChat {
    turns: AiTurn[];
    busy: boolean;
    ask(question: string): void;
    decide(turnIndex: number, approved: boolean): void;
    reset(): void;
}

const emptyTurn = (question: string): AiTurn => ({
    question,
    text: "",
    tools: [],
    completed: [],
    running: false,
    pendingApprovals: [],
    messages: [],
    settled: false
});

/**
 * Owns the AI conversation for the palette.
 *
 * State lives here rather than in a command's detail view because the design keeps ONE input row
 * across every mode — the palette renders the conversation, so it has to own it.
 */
export const useAiChat = (): UseAiChat => {
    const container = useContainer();
    const [turns, setTurns] = useState<AiTurn[]>([]);
    const [busy, setBusy] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    /* Read inside `run` so resuming sees the turn as it stands, without re-creating the callback. */
    const turnsRef = useRef<AiTurn[]>(turns);
    turnsRef.current = turns;

    /*
     * A stream stays open for as long as the model runs, so an unmounted palette would keep consuming
     * events into state that no longer exists.
     */
    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    const patch = useCallback((index: number, change: Partial<AiTurn>) => {
        setTurns(current =>
            current.map((turn, i) => (i === index ? { ...turn, ...change } : turn))
        );
    }, []);

    /** Replays settled turns so follow-ups ("and which of those is cheapest?") have context. */
    const historyBefore = useCallback(
        (upTo: number): AiChatMessage[] => {
            const history: AiChatMessage[] = [];

            for (const turn of turns.slice(0, upTo)) {
                if (!turn.settled || turn.error) {
                    continue;
                }
                history.push({ role: "user", content: turn.question });
                history.push(...turn.messages);
            }

            return history;
        },
        [turns]
    );

    const run = useCallback(
        async (index: number, request: AiChatRequest, resuming = false) => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setBusy(true);

            try {
                /*
                 * Resuming continues the same turn: the tools already called, the text already shown
                 * and the messages already collected all still belong to it. Starting from empty
                 * would strand earlier chips as running and — worse — drop the assistant message
                 * carrying the `tool_use` that the replayed `tool_result` refers to.
                 */
                const existing = resuming ? turnsRef.current[index] : undefined;
                let text = existing?.text ?? "";
                const tools: string[] = existing ? [...existing.tools] : [];
                const completed: string[] = existing ? [...existing.completed] : [];
                const priorMessages: AiChatMessage[] = existing ? [...existing.messages] : [];

                for await (const event of container
                    .resolve(AiChatGateway)
                    .stream(request, controller.signal)) {
                    if (event.type === "text") {
                        text += event.text;
                        patch(index, { text, running: false });
                        continue;
                    }

                    if (event.type === "tool-call") {
                        tools.push(event.name);
                        patch(index, { tools: [...tools], running: true });
                        continue;
                    }

                    if (event.type === "tool-result") {
                        completed.push(event.name);
                        patch(index, { completed: [...completed] });
                        continue;
                    }

                    if (event.type === "approval") {
                        patch(index, { pendingApprovals: event.approvals, running: false });
                        continue;
                    }

                    if (event.type === "done") {
                        patch(index, {
                            messages: [...priorMessages, ...event.messages],
                            settled: true,
                            running: false
                        });
                        continue;
                    }

                    if (event.type === "error") {
                        patch(index, { error: event.message, settled: true, running: false });
                        return;
                    }
                }
            } catch (error) {
                // An abort is the palette closing, not a failure worth showing.
                if (!controller.signal.aborted) {
                    patch(index, {
                        error: error instanceof Error ? error.message : String(error),
                        settled: true,
                        running: false
                    });
                }
            } finally {
                setBusy(false);
            }
        },
        [container, patch]
    );

    const ask = useCallback(
        (question: string) => {
            const trimmed = question.trim();
            if (!trimmed || busy) {
                return;
            }

            const index = turns.length;
            setTurns(current => [...current, { ...emptyTurn(trimmed), running: true }]);

            void run(index, {
                messages: [...historyBefore(index), { role: "user", content: trimmed }]
            });
        },
        [busy, historyBefore, run, turns.length]
    );

    const decide = useCallback(
        (turnIndex: number, approved: boolean) => {
            const turn = turns[turnIndex];
            if (!turn?.pendingApprovals.length || busy) {
                return;
            }

            const approvals = turn.pendingApprovals.map(approval => ({
                approvalId: approval.approvalId,
                approved
            }));

            /*
             * The paused assistant message must be replayed unchanged — the approval request lives only
             * in the server's messages, so resuming means sending the same history back plus the
             * decision.
             */
            const messages: AiChatMessage[] = [
                ...historyBefore(turnIndex),
                { role: "user", content: turn.question },
                ...turn.messages
            ];

            // Clear the block immediately so the plan cannot be submitted twice.
            patch(turnIndex, { pendingApprovals: [], settled: false, running: true });

            void run(turnIndex, { messages, approvals }, true);
        },
        [busy, historyBefore, patch, run, turns]
    );

    const reset = useCallback(() => {
        abortRef.current?.abort();
        setTurns([]);
        setBusy(false);
    }, []);

    return { turns, busy, ask, decide, reset };
};
