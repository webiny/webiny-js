import { hasToolCall } from "ai";
import { stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "~/api/features/Capabilities/index.js";
import { AiCapabilityNotConfiguredError } from "~/api/features/Capabilities/index.js";
import { GetAiChatUseCase } from "~/api/features/AiChats/GetAiChat/index.js";
import { SaveAiChatUseCase } from "~/api/features/AiChats/SaveAiChat/index.js";
import { canRetrySave } from "~/api/features/AiChats/domain/canRetrySave.js";
import { AdminAssistantConfig } from "./abstractions.js";
import { ADMIN_ASSISTANT_CAPABILITY } from "./capability.js";
import { AdminAssistantUseCase as Abstraction } from "./abstractions.js";
import type { AdminAssistantParams } from "./abstractions.js";
import { isReadOnly } from "~/api/features/shared/readOnlyTools.js";
import { toPendingApproval } from "./approvals.js";
import type { ApprovalDecision } from "./approvals.js";
import type { PendingApproval } from "./approvals.js";
import type { AdminAssistantEvent } from "./events.js";
import { FOLLOW_UPS_TOOL } from "./followUps.js";
import { followUpsTool } from "./followUps.js";
import { readFollowUps } from "./followUps.js";
import { unansweredApprovals } from "./unansweredApprovals.js";
import { decidesExactly } from "./decidesExactly.js";

/** The subset of the AI SDK's stream parts this use case reacts to. */
interface StreamPart {
    type: string;
    text?: string;
    toolName?: string;
    input?: unknown;
    approvalId?: string;
    toolCall?: {
        toolName: string;
        input: unknown;
    };
    error?: unknown;
}

const toMessage = (error: unknown): string => {
    return error instanceof Error ? error.message : String(error);
};

type ErrorEvent = Extract<AdminAssistantEvent, { type: "error" }>;
type SaveEvent = Extract<AdminAssistantEvent, { type: "saved" | "not-saved" }>;

/** Said to the model for an approval left unanswered when the user asked something else instead. */
const SUPERSEDED_REASON = "The user asked something else instead of deciding.";

/**
 * The terminal error event. Only a project with no model set up gets a code: it is the one failure
 * the client handles on its own. Codes from provider SDKs or Node (`ECONNRESET`) stay out, so the
 * client has a known set to handle.
 */
const toErrorEvent = (error: unknown): ErrorEvent => {
    const event: ErrorEvent = { type: "error", message: toMessage(error) };
    if (error instanceof AiCapabilityNotConfiguredError) {
        event.code = error.code;
    }
    return event;
};

interface ApprovalRequestPart {
    approvalId: string;
    toolCall: {
        toolName: string;
        input: unknown;
    };
}

/**
 * Turns the caller's approve/reject decisions into the tool message the SDK expects. Sent as its own
 * message so it lands after the assistant message that requested it.
 */
const toApprovalMessage = (decisions: ApprovalDecision[]): ModelMessage => {
    return {
        role: "tool",
        content: decisions.map(decision => {
            const part: {
                type: "tool-approval-response";
                approvalId: string;
                approved: boolean;
                reason?: string;
            } = {
                type: "tool-approval-response",
                approvalId: decision.approvalId,
                approved: decision.approved
            };

            if (decision.reason) {
                part.reason = decision.reason;
            }

            return part;
        })
    };
};

/**
 * Answers a question about the project by running an agent loop over the registered `AiSdkToolDefinition`s.
 *
 * Writes are gated. A tool that does not declare `readOnlyHint` is never executed on the model's word
 * alone — the loop pauses and the pending call is returned for a human to approve. Everything runs
 * under the caller's identity, so each tool is checked against that user's own permissions.
 */
class AdminAssistantUseCaseImpl implements Abstraction.Interface {
    constructor(
        private readonly ai: Ai.Interface,
        private readonly aiSdkTools: AiSdkTools.Interface,
        private readonly declarations: AiSdkToolDefinition.Interface[],
        private readonly identityContext: IdentityContext.Interface,
        private readonly config: AdminAssistantConfig.Interface,
        private readonly resolveCapability: ResolveAiCapabilityUseCase.Interface,
        private readonly getChat: GetAiChatUseCase.Interface,
        private readonly saveChat: SaveAiChatUseCase.Interface
    ) {}

    async *stream(params: AdminAssistantParams): AsyncIterable<AdminAssistantEvent> {
        let prepared;

        /*
         * An auth failure has to arrive as an event, not a thrown error: by the time a transport is
         * iterating this it has already committed to a 200 and a stream, so there is no status code
         * left to change.
         */
        try {
            prepared = await this.prepare(params);
        } catch (error) {
            yield toErrorEvent(error);
            return;
        }

        const { request, history } = prepared;
        const pending: PendingApproval[] = [];
        /*
         * Each step's text arrives with no separator, so the line before a tool call and the answer
         * after it ran together ("I'll look that up.3 products are on sale."). Text that resumes after
         * tool work starts a new paragraph instead.
         */
        let wroteText = false;
        let toolsSinceText = false;
        /*
         * Held until the run ends. Suggestions made alongside a proposed change would be about the
         * moment before the user decided, and would still be on screen after they ran or rejected it.
         */
        let followUps: string[] = [];

        yield { type: "start", model: request.model };

        try {
            const result = await this.ai.streamText(request);

            for await (const part of result.fullStream as AsyncIterable<StreamPart>) {
                if (part.type === "text-delta" && part.text) {
                    const text = wroteText && toolsSinceText ? `\n\n${part.text}` : part.text;
                    wroteText = true;
                    toolsSinceText = false;
                    yield { type: "text", text };
                    continue;
                }

                /*
                 * The follow-ups call is how the model passes suggestions, not work the user asked
                 * for, so it gets no chip. Its result is skipped below for the same reason.
                 */
                if (part.type === "tool-call" && part.toolName === FOLLOW_UPS_TOOL) {
                    followUps = readFollowUps(part.input);
                    continue;
                }

                // A rejected follow-ups call has no bearing on the answer, so it is not a failed step.
                if (
                    (part.type === "tool-result" || part.type === "tool-error") &&
                    part.toolName === FOLLOW_UPS_TOOL
                ) {
                    continue;
                }

                if (part.type === "tool-call" && part.toolName) {
                    toolsSinceText = true;
                    yield { type: "tool-call", name: part.toolName };
                    continue;
                }

                if (part.type === "tool-result" && part.toolName) {
                    yield { type: "tool-result", name: part.toolName };
                    continue;
                }

                /*
                 * A tool threw. Deliberately not terminal, unlike the stream-level `error` below:
                 * the SDK hands the message to the model, which typically fixes its arguments and
                 * tries again, so ending the run here would abort a recoverable turn. Every tool
                 * reports failure this way, so an unhandled `tool-error` leaves the call with no
                 * outcome at all.
                 */
                if (part.type === "tool-error" && part.toolName) {
                    yield {
                        type: "tool-error",
                        name: part.toolName,
                        message: toMessage(part.error)
                    };
                    continue;
                }

                if (part.type === "tool-approval-request" && part.approvalId && part.toolCall) {
                    pending.push(
                        toPendingApproval(
                            part.approvalId,
                            part.toolCall.toolName,
                            part.toolCall.input,
                            this.declarations
                        )
                    );
                    continue;
                }

                if (part.type === "error") {
                    yield toErrorEvent(part.error);
                    return;
                }
            }

            if (pending.length > 0) {
                yield { type: "approval", approvals: pending };
            } else if (followUps.length > 0) {
                yield { type: "follow-ups", questions: followUps };
            }

            /*
             * `responseMessages`, not `response.messages`: the former is the ACCUMULATED history of
             * every step, the latter only the final step's. Resuming after an approval needs the step
             * that carried the approval request, so the narrower one silently broke every write —
             * the SDK could not match the approvalId, and the model simply proposed the change again.
             *
             * Awaited only after the stream drains: these settle when the run finishes, so reading
             * them earlier would block the loop above and defeat the point of streaming.
             *
             * A run paused on an approval is saved too: the decision resumes it from storage.
             */
            const messages = [...history, ...(await result.responseMessages)];
            yield await this.save(params.chatId, messages);
            yield { type: "done", steps: (await result.steps).length };
        } catch (error) {
            yield toErrorEvent(error);
        }
    }

    /**
     * Stores the conversation after a run, as a new chat on the first question. Failing to store it
     * does not undo the answer, which the user has already read, so it is reported, not thrown.
     * Whether asking again could save it is for the chats feature to say.
     */
    private async save(chatId: string | undefined, messages: ModelMessage[]): Promise<SaveEvent> {
        const input: SaveAiChatUseCase.Input = { messages };
        if (chatId) {
            input.id = chatId;
        }

        try {
            const result = await this.saveChat.execute(input);
            if (result.isFail()) {
                const retryable = canRetrySave(result.error);
                return { type: "not-saved", message: result.error.message, retryable };
            }

            const { id, title, createdOn, savedOn } = result.value;
            return { type: "saved", chat: { id, title, createdOn, savedOn } };
        } catch (error) {
            // Every failure the save expects is a result, so a throw is a bug that would repeat.
            return { type: "not-saved", message: toMessage(error), retryable: false };
        }
    }

    /**
     * The conversation the model sees: the saved chat, then either the decision on its paused run or
     * the new question. A new question on a chat still paused rejects what was waiting first, since a
     * request with no answer is something the provider refuses.
     */
    private async history(params: AdminAssistantParams): Promise<ModelMessage[]> {
        const stored: ModelMessage[] = [];
        if (params.chatId) {
            const chat = await this.getChat.execute(params.chatId);
            if (chat.isFail()) {
                throw chat.error;
            }
            stored.push(...chat.value.messages);
        }

        const waiting = unansweredApprovals(stored);

        if (!params.prompt) {
            if (waiting.length === 0) {
                throw new Error("Nothing in this chat is waiting for a decision.");
            }
            if (!decidesExactly(params.decisions, waiting)) {
                throw new Error("This decision is not for the changes waiting in this chat.");
            }
            return [...stored, toApprovalMessage(params.decisions)];
        }

        const history = [...stored];
        if (waiting.length > 0) {
            const superseded = waiting.map(approvalId => ({
                approvalId,
                approved: false,
                reason: SUPERSEDED_REASON
            }));
            const rejection = toApprovalMessage(superseded);
            history.push(rejection);
        }
        history.push({ role: "user", content: params.prompt });
        return history;
    }

    /**
     * Everything a run needs: the identity check, the conversation so far, which tools may run
     * unattended, and the fully-formed model request.
     */
    private async prepare(params: AdminAssistantParams): Promise<{
        request: Ai.GenerateTextParams;
        history: ModelMessage[];
    }> {
        if (this.identityContext.getIdentity().isAnonymous()) {
            throw new NotAuthorizedError();
        }

        const history = await this.history(params);

        const tools = { ...this.aiSdkTools.getToolSet(), [FOLLOW_UPS_TOOL]: followUpsTool };
        const readOnlyNames = new Set([
            ...this.declarations.filter(isReadOnly).map(declaration => declaration.name),
            FOLLOW_UPS_TOOL
        ]);

        /*
         * Every tool is offered. The controls are the caller's own permissions — each tool runs through
         * the same use cases as the admin UI — and the approval pause, which stops a mutating call
         * until a human has seen its exact arguments.
         */
        const activeTools = Object.keys(tools);

        const resolution = await this.resolveCapability.execute(ADMIN_ASSISTANT_CAPABILITY);

        /*
         * Thrown rather than swallowed. Every message the resolver produces names the setting to
         * fix, and `stream` turns a throw into an `error` event, so the editor reads "pick a model
         * under Settings → AI Power-Ups → Model roles" instead of watching the assistant fail.
         */
        if (resolution.isFail()) {
            throw resolution.error;
        }

        const capability = resolution.value;

        const request: Ai.GenerateTextParams = {
            model: capability.model,
            connection: capability.connection,
            system: withAdditionalInstructions(capability),
            messages: history,
            tools,
            activeTools,
            toolChoice: "auto",
            toolApproval: ({ toolCall }: { toolCall: { toolName: string } }) => {
                return readOnlyNames.has(toolCall.toolName) ? "not-applicable" : "user-approval";
            },
            /*
             * The follow-ups call comes last, after the answer. Stopping on it saves the step the
             * SDK would otherwise spend letting the model react to its own suggestions.
             */
            stopWhen: [stepCountIs(this.config.maxSteps), hasToolCall(FOLLOW_UPS_TOOL)]
        };

        return { request, history };
    }

    /**
     * `result.text` is empty when the run ended on a tool call or an approval request, so fall back to
     * the most recent step that produced prose.
     */
    private extractText(result: { text: string; steps: { text: string }[] }): string {
        if (result.text) {
            return result.text;
        }

        const lastWithText = result.steps.filter(step => step.text.length > 0).pop();

        return lastWithText ? lastWithText.text : "";
    }

    private extractToolCalls(result: {
        steps: { toolCalls: { toolName: string; input: unknown }[] }[];
    }): { name: string; input: unknown }[] {
        return result.steps.flatMap(step => {
            return step.toolCalls.map(call => ({ name: call.toolName, input: call.input }));
        });
    }

    private extractPendingApprovals(result: {
        steps: { content: unknown[] }[];
    }): PendingApproval[] {
        return result.steps.flatMap(step => {
            return step.content
                .filter(part => (part as { type: string }).type === "tool-approval-request")
                .map(part => {
                    const request = part as unknown as ApprovalRequestPart;

                    return toPendingApproval(
                        request.approvalId,
                        request.toolCall.toolName,
                        request.toolCall.input,
                        this.declarations
                    );
                });
        });
    }
}

export const AdminAssistantUseCase = Abstraction.createImplementation({
    implementation: AdminAssistantUseCaseImpl,
    dependencies: [
        Ai,
        AiSdkTools,
        [AiSdkToolDefinition, { multiple: true }],
        IdentityContext,
        AdminAssistantConfig,
        ResolveAiCapabilityUseCase,
        GetAiChatUseCase,
        SaveAiChatUseCase
    ]
});
