import { makeAutoObservable } from "mobx";
import { AdminAssistantGateway } from "./abstractions.js";
import type { AdminAssistantMessage, AdminAssistantRequest } from "./abstractions.js";
import {
    AdminAssistantPresenter as Abstraction,
    type AiTurnViewModel,
    type IAdminAssistantViewModel
} from "./abstractions.js";
import { AiChatsRepository } from "~/features/aiChats/abstractions.js";
import { turnsFromMessages } from "./turnsFromMessages.js";

const messageOf = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

/** A turn plus the conversation state the view never sees. */
interface Turn extends AiTurnViewModel {
    /** Server messages replayed to continue this conversation or resume its approval. */
    messages: AdminAssistantMessage[];
}

const emptyTurn = (question: string): Turn => ({
    question,
    text: "",
    answerStart: 0,
    tools: [],
    completed: [],
    failed: [],
    running: false,
    pendingApprovals: [],
    followUps: [],
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
 *
 * The conversation is saved after every run that ends, so it is never more than one turn behind
 * what is on screen. The client saves rather than the stream route, which keeps the route
 * sessionless.
 */
class AdminAssistantPresenterImpl implements Abstraction.Interface {
    private turns: Turn[] = [];
    private busy = false;
    private model: string | undefined = undefined;
    private chatId: string | null = null;
    private opening = false;
    private storageError: string | null = null;
    private controller: AbortController | null = null;
    /*
     * Saves run one after another, so the second save of a new chat already has the id the first
     * one got back, rather than creating a second chat.
     */
    private saving: Promise<void> = Promise.resolve();
    /*
     * Bumped whenever the conversation is replaced. A save or an open that finishes after that
     * belongs to a conversation that is gone, and must not write its id onto the new one.
     */
    private generation = 0;

    constructor(
        private gateway: AdminAssistantGateway.Interface,
        private chats: AiChatsRepository.Interface
    ) {
        // Machinery, not state anything renders, so keep them out of the map.
        makeAutoObservable<
            AdminAssistantPresenterImpl,
            "controller" | "saving" | "generation" | "chats"
        >(this, { controller: false, saving: false, generation: false, chats: false });
    }

    get vm(): IAdminAssistantViewModel {
        const vm: IAdminAssistantViewModel = {
            busy: this.busy,
            chatId: this.chatId,
            opening: this.opening,
            storageError: this.storageError,
            turns: this.turns.map(turn => {
                const view: AiTurnViewModel = {
                    question: turn.question,
                    text: turn.text,
                    answerStart: turn.answerStart,
                    tools: turn.tools,
                    completed: turn.completed,
                    failed: turn.failed,
                    running: turn.running,
                    pendingApprovals: turn.pendingApprovals,
                    followUps: turn.followUps,
                    settled: turn.settled
                };

                if (turn.error !== undefined) {
                    view.error = turn.error;
                }

                return view;
            })
        };

        if (this.model !== undefined) {
            vm.model = this.model;
        }

        return vm;
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
        const messages: AdminAssistantMessage[] = [
            ...this.historyBefore(turnIndex),
            { role: "user", content: turn.question },
            ...turn.messages
        ];

        // Clear the block immediately so the plan cannot be submitted twice.
        this.patch(turnIndex, {
            pendingApprovals: [],
            followUps: [],
            settled: false,
            running: true
        });

        void this.run(turnIndex, { messages, approvals }, true);
    }

    reset(): void {
        this.controller?.abort();
        this.controller = null;
        this.generation++;
        this.clear();
    }

    async open(chatId: string): Promise<void> {
        this.reset();
        const generation = this.generation;
        this.setOpening(true);

        try {
            const chat = await this.chats.get(chatId);
            if (generation !== this.generation) {
                return;
            }
            const turns = turnsFromMessages(chat.messages);
            this.setConversation(chat.id, turns);
        } catch (error) {
            if (generation === this.generation) {
                this.setStorageError(messageOf(error));
            }
        } finally {
            if (generation === this.generation) {
                this.setOpening(false);
            }
        }
    }

    /*
     * Queued behind any save still in flight. A turn waiting on an approval is not saved yet: its
     * paused request has no answer, and replaying it unanswered later would not resume it. The save
     * after the decision covers it.
     */
    private queueSave(): void {
        const waiting = this.turns.some(turn => turn.pendingApprovals.length > 0);
        const messages = this.historyBefore(this.turns.length);

        if (waiting || messages.length === 0) {
            return;
        }

        const generation = this.generation;
        this.saving = this.saving.then(() => this.save(generation, messages));
    }

    private async save(generation: number, messages: AdminAssistantMessage[]): Promise<void> {
        if (generation !== this.generation) {
            return;
        }

        try {
            const input: AiChatsRepository.SaveInput = { messages };
            if (this.chatId) {
                input.id = this.chatId;
            }

            const summary = await this.chats.save(input);
            if (generation === this.generation) {
                this.setSaved(summary.id);
            }
        } catch (error) {
            if (generation === this.generation) {
                this.setStorageError(messageOf(error));
            }
        }
    }

    /** Replays settled turns so a follow-up ("and which of those is cheapest?") has context. */
    private historyBefore(upTo: number): AdminAssistantMessage[] {
        const history: AdminAssistantMessage[] = [];

        for (const turn of this.turns.slice(0, upTo)) {
            if (!turn.settled || turn.error) {
                continue;
            }
            history.push({ role: "user", content: turn.question });
            history.push(...turn.messages);
        }

        return history;
    }

    private async run(
        index: number,
        request: AdminAssistantRequest,
        resuming = false
    ): Promise<void> {
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
            const priorMessages: AdminAssistantMessage[] = existing ? [...existing.messages] : [];
            /*
             * A resumed run writes on after the text shown before the approval pause. Without a
             * break, the two ran together ("...a new folder:Understood, no folder was created.").
             */
            let separateFromExisting = text.length > 0;

            for await (const event of this.gateway.stream(request, controller.signal)) {
                if (event.type === "start") {
                    this.setModel(event.model);
                    continue;
                }

                if (event.type === "text") {
                    text += separateFromExisting ? `\n\n${event.text}` : event.text;
                    separateFromExisting = false;
                    this.patch(index, { text, running: false });
                    continue;
                }

                if (event.type === "tool-call") {
                    tools.push(event.name);
                    this.patch(index, {
                        tools: [...tools],
                        running: true,
                        answerStart: text.length
                    });
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

                if (event.type === "follow-ups") {
                    this.patch(index, { followUps: event.questions });
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

        // A failed turn is left out of the history, so saving after it would change nothing.
        const turn = this.turns[index];
        if (!controller.signal.aborted && turn?.settled && !turn.error) {
            this.queueSave();
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

    private setModel(model: string): void {
        this.model = model;
    }

    private setOpening(opening: boolean): void {
        this.opening = opening;
    }

    private setConversation(chatId: string, turns: Turn[]): void {
        this.chatId = chatId;
        this.turns = turns;
    }

    private setSaved(chatId: string): void {
        this.chatId = chatId;
        this.storageError = null;
    }

    private setStorageError(message: string): void {
        this.storageError = message;
    }

    private clear(): void {
        this.turns = [];
        this.busy = false;
        this.chatId = null;
        this.opening = false;
        this.storageError = null;
    }
}

export const AdminAssistantPresenter = Abstraction.createImplementation({
    implementation: AdminAssistantPresenterImpl,
    dependencies: [AdminAssistantGateway, AiChatsRepository]
});
