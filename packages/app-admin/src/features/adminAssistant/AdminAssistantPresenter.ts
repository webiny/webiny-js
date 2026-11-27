import { makeAutoObservable } from "mobx";
import { AdminAssistantGateway } from "./abstractions.js";
import type { AdminAssistantRequest } from "./abstractions.js";
import type { AdminAssistantClientToolCall } from "./abstractions.js";
import type { AdminAssistantClientToolResult } from "./abstractions.js";
import type { AdminAssistantDecision } from "./abstractions.js";
import { AdminAssistantPresenter as Abstraction } from "./abstractions.js";
import type { AiTurnViewModel } from "./abstractions.js";
import { AiChatsRepository } from "~/features/aiChats/abstractions.js";
import { AssistantPageContext } from "~/features/assistantPageContext/abstractions.js";
import { AssistantClientTools } from "~/features/assistantClientTools/abstractions.js";
import { AssistantComposerControls } from "~/features/assistantComposerControls/abstractions.js";
import type { AiChatSaveFailure } from "~/features/aiChats/abstractions.js";
import { messageOf } from "~/features/aiChats/messageOf.js";
import { turnsFromMessages } from "./turnsFromMessages.js";

/** A turn plus the state the view never sees. `needsSetup` is derived from `errorCode`. */
interface Turn extends Omit<AiTurnViewModel, "needsSetup"> {
    /** The server's code for the failure, when it sent one. */
    errorCode?: string;
}

/** What a request answered a paused run with, or carried with a question, until the chat is saved. */
interface UnsavedAnswers {
    approvals: AdminAssistantDecision[];
    toolResults: AdminAssistantClientToolResult[];
    /** Sent with a question rather than to resume a run. */
    withQuestion: boolean;
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
     * Results of browser calls made next to an approval. The run waits for both, so they go with the
     * decision.
     */
    private heldResults: AdminAssistantClientToolResult[] = [];
    /*
     * What the last request answered a paused run with, or brought along with a question, until the
     * server saves the chat with it. Browser results stand for changes already made on the page, so
     * if that request fails, "Try again" sends the same again: asking the question afresh would have
     * the model make the changes a second time.
     */
    private unsaved: UnsavedAnswers | null = null;
    /*
     * The tools the last request offered. A call the run makes is run by the same tool, from the same
     * screen, or not at all: a screen opened since may register a tool of the same name.
     */
    private offeredTools: AssistantClientTools.Tool[] = [];
    /*
     * Bumped whenever the conversation is replaced. An open that finishes after that belongs to a
     * conversation that is gone, and must not write its turns onto the new one.
     */
    private generation = 0;

    constructor(
        private gateway: AdminAssistantGateway.Interface,
        private chats: AiChatsRepository.Interface,
        private pageContext: AssistantPageContext.Interface,
        private clientTools: AssistantClientTools.Interface,
        private composerControls: AssistantComposerControls.Interface
    ) {
        // Machinery, not state anything renders, so keep them out of the map.
        makeAutoObservable<
            AdminAssistantPresenterImpl,
            | "controller"
            | "generation"
            | "chats"
            | "pageContext"
            | "clientTools"
            | "composerControls"
            | "heldResults"
            | "unsaved"
            | "offeredTools"
        >(this, {
            controller: false,
            generation: false,
            chats: false,
            pageContext: false,
            clientTools: false,
            composerControls: false,
            heldResults: false,
            unsaved: false,
            offeredTools: false
        });
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

        /*
         * Asking something else rejects a change still waiting; the server does the same. Browser
         * calls that already ran go with the question, so the server records what they did rather
         * than reporting them as not run.
         */
        this.dropPendingApprovals();
        const unsent = this.unsaved?.toolResults ?? [];
        const ran = [...this.heldResults, ...unsent];
        this.heldResults = [];
        this.unsaved = null;
        this.clearStorageError();

        const index = this.turns.length;
        this.addTurn(trimmed);
        const request = this.question(trimmed);
        if (ran.length > 0 && request.chatId) {
            request.toolResults = ran;
            this.unsaved = { approvals: [], toolResults: ran, withQuestion: true };
        }
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

        const toolResults = this.heldResults;
        this.heldResults = [];
        this.unsaved = { approvals, toolResults, withQuestion: false };
        const request = this.request({ approvals });
        if (toolResults.length > 0) {
            request.toolResults = toolResults;
        }
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

        const unsaved = this.unsaved;

        /*
         * A failed resume that carried only browser results: send the same results, since the
         * browser's changes are made. A decision is never sent again: the server may have run the
         * approved tool before the run failed, and the saved chat would still show it waiting, so a
         * second approval would run it twice.
         */
        const resend = unsaved && !unsaved.withQuestion && unsaved.approvals.length === 0;
        if (resend && this.chatId) {
            this.patch(index, {
                error: undefined,
                errorCode: undefined,
                settled: false,
                running: true
            });
            const resume = this.request({ toolResults: unsaved.toolResults });
            const request = this.withPageContext(resume);
            void this.run(index, request, true);
            return;
        }

        /*
         * Otherwise the question is asked again. The server rejects a decision still waiting, so the
         * model asks for approval again. Results of calls that ran go with it.
         */
        const fresh = emptyTurn(turn.question);
        this.replaceTurn(index, { ...fresh, running: true });
        const request = this.question(turn.question);
        const ran = unsaved?.toolResults ?? [];
        if (ran.length > 0 && request.chatId) {
            request.toolResults = ran;
        }
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
        this.heldResults = [];
        this.unsaved = null;
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

    /**
     * A question, with whatever the screen behind the palette says about itself. Read at the moment
     * of asking, so a retry describes the screen the user is on now.
     */
    private question(prompt: string): AdminAssistantRequest {
        const request = this.request({ prompt });
        return this.withPageContext(request);
    }

    private withPageContext(request: AdminAssistantRequest): AdminAssistantRequest {
        const pageContext = this.pageContext.get();
        if (pageContext) {
            request.pageContext = pageContext;
        }
        return request;
    }

    /**
     * A request for the chat on screen: the server reads its history from the saved chat. Carries
     * the tools the screen runs now, since a resumed run may call them again, and what the screen's
     * composer controls are set to, since every run builds its instructions afresh.
     */
    private request(rest: Omit<AdminAssistantRequest, "chatId">): AdminAssistantRequest {
        const request: AdminAssistantRequest = { ...rest };
        if (this.chatId) {
            request.chatId = this.chatId;
        }
        const tools = this.clientTools.list();
        this.offeredTools = tools;
        if (tools.length > 0) {
            request.clientTools = tools.map(({ name, description, inputSchema }) => ({
                name,
                description,
                inputSchema
            }));
        }
        const controls = this.composerControls.values();
        if (Object.keys(controls).length > 0) {
            request.controls = controls;
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

        const offered = this.offeredTools;
        let clientCalls: AdminAssistantClientToolCall[] = [];
        let waitsForApproval = false;
        let finished = false;

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
                    waitsForApproval = true;
                    this.patch(index, { pendingApprovals: event.approvals, running: false });
                    continue;
                }

                if (event.type === "client-tools") {
                    clientCalls = event.calls;
                    continue;
                }

                if (event.type === "saved") {
                    this.unsaved = null;
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
                    finished = true;
                    // A run paused on browser calls goes on once they have run.
                    if (clientCalls.length === 0) {
                        this.patch(index, { settled: true, running: false });
                    }
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

        if (finished && clientCalls.length > 0 && !controller.signal.aborted) {
            await this.runClientCalls(index, clientCalls, waitsForApproval, offered);
        }
    }

    /**
     * Runs the calls a run paused on against the screen, then resumes the run with their results.
     * Next to an approval, the results wait for the decision instead, since the run waits for both.
     */
    private async runClientCalls(
        index: number,
        calls: AdminAssistantClientToolCall[],
        waitsForApproval: boolean,
        offered: AssistantClientTools.Tool[]
    ): Promise<void> {
        /*
         * The paused run is resumed from the saved chat, so a run that was not saved cannot be. Its
         * calls are not run either: the page would change and nothing would record it, so asking
         * again would have the model make the same changes twice.
         */
        if (!this.chatId || this.saveFailure) {
            this.patch(index, {
                error: "The assistant can't carry on because the chat wasn't saved. Ask again to retry.",
                pendingApprovals: [],
                settled: true,
                running: false
            });
            return;
        }

        const generation = this.generation;
        this.setBusy(true);
        this.patch(index, { running: !waitsForApproval });

        const results: AdminAssistantClientToolResult[] = [];
        for (const call of calls) {
            const result = await this.clientTools.run(call, offered);
            if (generation !== this.generation) {
                return;
            }
            results.push(result);
            const turn = this.turns[index];
            if (turn && result.error !== undefined) {
                this.patch(index, { failed: [...turn.failed, call.toolName] });
            } else if (turn) {
                this.patch(index, { completed: [...turn.completed, call.toolName] });
            }
        }

        this.setBusy(false);

        if (waitsForApproval) {
            this.heldResults = results;
            return;
        }

        this.unsaved = { approvals: [], toolResults: results, withQuestion: false };
        const resume = this.request({ toolResults: results });
        const request = this.withPageContext(resume);
        await this.run(index, request, true);
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
    dependencies: [
        AdminAssistantGateway,
        AiChatsRepository,
        AssistantPageContext,
        AssistantClientTools,
        AssistantComposerControls
    ]
});
