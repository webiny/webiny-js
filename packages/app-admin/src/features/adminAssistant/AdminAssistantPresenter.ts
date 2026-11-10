import { makeAutoObservable } from "mobx";
import { AdminAssistantGateway } from "./abstractions.js";
import type { AdminAssistantRequest } from "./abstractions.js";
import { AdminAssistantPresenter as Abstraction } from "./abstractions.js";
import type { AiTurnViewModel } from "./abstractions.js";
import { AiChatsRepository } from "~/features/aiChats/abstractions.js";
import type { AiChatSaveFailure } from "~/features/aiChats/abstractions.js";
import { messageOf } from "~/features/aiChats/messageOf.js";
import { turnsFromMessages } from "./turnsFromMessages.js";

/** A turn plus the state the view never sees. `needsSetup` is derived from `errorCode`. */
interface Turn extends Omit<AiTurnViewModel, "needsSetup"> {
    /** The server's code for the failure, when it sent one. */
    errorCode?: string;
}

/** The code a run fails with when the project's AI settings give the assistant no model. */
const NOT_CONFIGURED = "AI_CAPABILITY_NOT_CONFIGURED";

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
 * The server keeps the conversation: a question sends only the chat id and the question, and the
 * assistant reads the history from the saved chat and saves the run when it ends. The turns here
 * are what is shown, never what is sent.
 */
class AdminAssistantPresenterImpl implements Abstraction.Interface {
    private turns: Turn[] = [];
    private busy = false;
    private model: string | undefined = undefined;
    private chatId: string | null = null;
    private opening = false;
    private storageError: string | null = null;
    private saveFailure: AiChatSaveFailure | null = null;
    private controller: AbortController | null = null;
    /*
     * Bumped whenever the conversation is replaced. An open that finishes after that belongs to a
     * conversation that is gone, and must not write its turns onto the new one.
     */
    private generation = 0;

    constructor(
        private gateway: AdminAssistantGateway.Interface,
        private chats: AiChatsRepository.Interface
    ) {
        // Machinery, not state anything renders, so keep them out of the map.
        makeAutoObservable<AdminAssistantPresenterImpl, "controller" | "generation" | "chats">(
            this,
            { controller: false, generation: false, chats: false }
        );
    }

    get vm(): Abstraction.ViewModel {
        const vm: Abstraction.ViewModel = {
            busy: this.busy,
            chatId: this.chatId,
            opening: this.opening,
            storageError: this.storageError,
            saveFailure: this.saveFailure,
            setupRequired: this.setupRequired,
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
                    settled: turn.settled,
                    needsSetup: turn.errorCode === NOT_CONFIGURED
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

        /*
         * While a saved chat loads, a question would land in a conversation about to be replaced.
         * With no model set up it would fail the same way, so only "Try again" asks.
         */
        if (!trimmed || this.busy || this.opening || this.setupRequired) {
            return;
        }

        // Asking something else rejects a change still waiting; the server does the same.
        this.dropPendingApprovals();
        this.clearStorageError();

        const index = this.turns.length;
        this.addTurn(trimmed);
        const request = this.request({ prompt: trimmed });
        void this.run(index, request);
    }

    decide(turnIndex: number, approved: boolean): void {
        const turn = this.turns[turnIndex];

        if (!turn?.pendingApprovals.length || this.busy || this.opening) {
            return;
        }

        // The paused run is resumed from the saved chat, so a run that was not saved cannot be.
        if (!this.chatId || this.saveFailure) {
            this.patch(turnIndex, {
                pendingApprovals: [],
                error: "This change can't run because the chat wasn't saved. Ask again to retry."
            });
            return;
        }

        const approvals = turn.pendingApprovals.map(approval => ({
            approvalId: approval.approvalId,
            approved
        }));

        // Clear the block immediately so the plan cannot be submitted twice.
        this.patch(turnIndex, {
            pendingApprovals: [],
            followUps: [],
            settled: false,
            running: true
        });

        const request = this.request({ approvals });
        void this.run(turnIndex, request, true);
    }

    /*
     * The newest turn asked again in place, from an empty answer: one that failed, or one that ran
     * but was not saved. Either way the saved chat does not have it, so the server answers it again
     * with the same history it had the first time.
     */
    retry(): void {
        const index = this.turns.length - 1;
        const turn = this.turns[index];

        if (!turn || this.busy || this.opening) {
            return;
        }
        // A run that cannot be saved by asking again is left for a new chat.
        if (!turn.error && this.saveFailure !== "retryable") {
            return;
        }

        this.clearStorageError();
        const fresh = emptyTurn(turn.question);
        this.replaceTurn(index, { ...fresh, running: true });
        const request = this.request({ prompt: turn.question });
        void this.run(index, request);
    }

    private get setupRequired(): boolean {
        const newest = this.turns[this.turns.length - 1];
        return newest?.errorCode === NOT_CONFIGURED;
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
                const message = messageOf(error);
                this.setStorageError(message);
            }
        } finally {
            if (generation === this.generation) {
                this.setOpening(false);
            }
        }
    }

    /** A request for the chat on screen: the server reads its history from the saved chat. */
    private request(rest: Omit<AdminAssistantRequest, "chatId">): AdminAssistantRequest {
        const request: AdminAssistantRequest = { ...rest };
        if (this.chatId) {
            request.chatId = this.chatId;
        }
        return request;
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

                if (event.type === "saved") {
                    this.setSaved(event.chat);
                    continue;
                }

                /*
                 * A resumed run may have carried out the change the user approved. Asking again
                 * would start before that change, so the model proposes it again and approving
                 * twice makes it twice. Only a new chat is offered then.
                 */
                if (event.type === "not-saved") {
                    const failure = event.retryable && !resuming ? "retryable" : "final";
                    this.setSaveFailed(event.message, failure);
                    continue;
                }

                if (event.type === "done") {
                    this.patch(index, { settled: true, running: false });
                    continue;
                }

                if (event.type === "error") {
                    this.patch(index, {
                        error: event.message,
                        errorCode: event.code,
                        settled: true,
                        running: false
                    });
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

    private replaceTurn(index: number, turn: Turn): void {
        this.turns = this.turns.map((existing, i) => (i === index ? turn : existing));
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

    // The chats list learns of the chat from here, so it shows up without being read again.
    private setSaved(chat: AiChatsRepository.Summary): void {
        this.chatId = chat.id;
        this.storageError = null;
        this.saveFailure = null;
        this.chats.remember(chat);
    }

    private dropPendingApprovals(): void {
        this.turns = this.turns.map(turn => {
            if (turn.pendingApprovals.length === 0) {
                return turn;
            }
            return { ...turn, pendingApprovals: [] };
        });
    }

    private setStorageError(message: string): void {
        this.storageError = message;
        this.saveFailure = null;
    }

    private setSaveFailed(message: string, failure: AiChatSaveFailure): void {
        this.storageError = message;
        this.saveFailure = failure;
    }

    private clearStorageError(): void {
        this.storageError = null;
        this.saveFailure = null;
    }

    private clear(): void {
        this.turns = [];
        this.busy = false;
        this.chatId = null;
        this.opening = false;
        this.storageError = null;
        this.saveFailure = null;
    }
}

export const AdminAssistantPresenter = Abstraction.createImplementation({
    implementation: AdminAssistantPresenterImpl,
    dependencies: [AdminAssistantGateway, AiChatsRepository]
});
