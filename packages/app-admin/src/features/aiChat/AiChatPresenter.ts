import { makeAutoObservable } from "mobx";
import { AiChatGateway } from "./abstractions.js";
import type { AiChatMessage, AiChatRequest } from "./abstractions.js";
import {
    AiChatPresenter as Abstraction,
    type AiTurnViewModel,
    type IAiChatViewModel
} from "./abstractions.js";

/** A turn plus the conversation state the view never sees. */
interface Turn extends AiTurnViewModel {
    /** Server messages replayed to continue this conversation or resume its approval. */
    messages: AiChatMessage[];
}

const emptyTurn = (question: string): Turn => ({
    question,
    text: "",
    tools: [],
    completed: [],
    failed: [],
    running: false,
    pendingApprovals: [],
    messages: [],
    settled: false
});

/**
 * Owns the palette's AI conversation.
 *
 * A presenter rather than component state: several pieces change together, a network stream drives
 * them, and an abort has to outlive any one render.
 *
 * Registered as a singleton, so `reset` genuinely clears rather than relying on unmount.
 */
class AiChatPresenterImpl implements Abstraction.Interface {
    private turns: Turn[] = [];
    private busy = false;
    private controller: AbortController | null = null;

    constructor(private gateway: AiChatGateway.Interface) {
        // The controller is machinery, not state anything renders, so keep it out of the map.
        makeAutoObservable<AiChatPresenterImpl, "controller">(this, { controller: false });
    }

    get vm(): IAiChatViewModel {
        return {
            busy: this.busy,
            turns: this.turns.map(turn => ({
                question: turn.question,
                text: turn.text,
                tools: turn.tools,
                completed: turn.completed,
                failed: turn.failed,
                running: turn.running,
                pendingApprovals: turn.pendingApprovals,
                settled: turn.settled,
                ...(turn.error === undefined ? {} : { error: turn.error })
            }))
        };
    }

    ask(question: string): void {
        const trimmed = question.trim();

        if (!trimmed || this.busy) {
            return;
        }

        const index = this.turns.length;
        this.addTurn(trimmed);

        void this.run(index, {
            messages: [...this.historyBefore(index), { role: "user", content: trimmed }]
        });
    }

    decide(turnIndex: number, approved: boolean): void {
        const turn = this.turns[turnIndex];

        if (!turn?.pendingApprovals.length || this.busy) {
            return;
        }

        const approvals = turn.pendingApprovals.map(approval => ({
            approvalId: approval.approvalId,
            approved
        }));

        /*
         * The paused assistant message must be replayed unchanged: the approval request lives only in
         * the server's messages, so resuming means sending the same history back plus the decision.
         */
        const messages: AiChatMessage[] = [
            ...this.historyBefore(turnIndex),
            { role: "user", content: turn.question },
            ...turn.messages
        ];

        // Clear the block immediately so the plan cannot be submitted twice.
        this.patch(turnIndex, { pendingApprovals: [], settled: false, running: true });

        void this.run(turnIndex, { messages, approvals }, true);
    }

    reset(): void {
        this.controller?.abort();
        this.controller = null;
        this.clear();
    }

    /** Replays settled turns so a follow-up ("and which of those is cheapest?") has context. */
    private historyBefore(upTo: number): AiChatMessage[] {
        const history: AiChatMessage[] = [];

        for (const turn of this.turns.slice(0, upTo)) {
            if (!turn.settled || turn.error) {
                continue;
            }
            history.push({ role: "user", content: turn.question });
            history.push(...turn.messages);
        }

        return history;
    }

    private async run(index: number, request: AiChatRequest, resuming = false): Promise<void> {
        this.controller?.abort();
        const controller = new AbortController();
        this.controller = controller;

        this.setBusy(true);

        try {
            /*
             * Resuming continues the same turn: the tools already called, the text already shown and
             * the messages already collected all still belong to it. Starting from empty would strand
             * earlier chips as running and, worse, drop the assistant message carrying the `tool_use`
             * that the replayed `tool_result` refers to.
             */
            const existing = resuming ? this.turns[index] : undefined;
            let text = existing?.text ?? "";
            const tools: string[] = existing ? [...existing.tools] : [];
            const completed: string[] = existing ? [...existing.completed] : [];
            const failed: string[] = existing ? [...existing.failed] : [];
            const priorMessages: AiChatMessage[] = existing ? [...existing.messages] : [];

            for await (const event of this.gateway.stream(request, controller.signal)) {
                if (event.type === "text") {
                    text += event.text;
                    this.patch(index, { text, running: false });
                    continue;
                }

                if (event.type === "tool-call") {
                    tools.push(event.name);
                    this.patch(index, { tools: [...tools], running: true });
                    continue;
                }

                if (event.type === "tool-result") {
                    completed.push(event.name);
                    this.patch(index, { completed: [...completed] });
                    continue;
                }

                if (event.type === "tool-error") {
                    failed.push(event.name);
                    this.patch(index, { failed: [...failed] });
                    continue;
                }

                if (event.type === "approval") {
                    this.patch(index, { pendingApprovals: event.approvals, running: false });
                    continue;
                }

                if (event.type === "done") {
                    this.patch(index, {
                        messages: [...priorMessages, ...event.messages],
                        settled: true,
                        running: false
                    });
                    continue;
                }

                if (event.type === "error") {
                    this.patch(index, { error: event.message, settled: true, running: false });
                    return;
                }
            }
        } catch (error) {
            // An abort is the palette closing, not a failure worth showing.
            if (!controller.signal.aborted) {
                this.patch(index, {
                    error: error instanceof Error ? error.message : String(error),
                    settled: true,
                    running: false
                });
            }
        } finally {
            this.setBusy(false);
        }
    }

    /*
     * Every mutation below is its own method on purpose. `run` awaits, and a mutation after an await
     * has escaped the action it started in; `makeAutoObservable` makes these methods actions, so
     * calling them from there is correct.
     */
    private addTurn(question: string): void {
        this.turns = [...this.turns, { ...emptyTurn(question), running: true }];
    }

    private patch(index: number, change: Partial<Turn>): void {
        this.turns = this.turns.map((turn, i) => (i === index ? { ...turn, ...change } : turn));
    }

    private setBusy(busy: boolean): void {
        this.busy = busy;
    }

    private clear(): void {
        this.turns = [];
        this.busy = false;
    }
}

export const AiChatPresenter = Abstraction.createImplementation({
    implementation: AiChatPresenterImpl,
    dependencies: [AiChatGateway]
});
