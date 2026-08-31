import { stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { AiChatConfig } from "./abstractions.js";
import { AiChatProvider } from "./abstractions.js";
import { AiChatUseCase as Abstraction } from "./abstractions.js";
import type { AiChatParams } from "./abstractions.js";
import type { AiChatResult } from "./abstractions.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { isReadOnly } from "./approvals.js";
import { toPendingApproval } from "./approvals.js";
import type { ApprovalDecision } from "./approvals.js";
import type { PendingApproval } from "./approvals.js";
import type { AiChatEvent } from "./events.js";

/** The subset of the AI SDK's stream parts this use case reacts to. */
interface StreamPart {
    type: string;
    text?: string;
    toolName?: string;
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
 * Answers a question about the project by running an agent loop over the registered `AiSdkTool`s.
 *
 * Writes are gated. A tool that does not declare `readOnlyHint` is never executed on the model's word
 * alone — the loop pauses and the pending call is returned for a human to approve. Everything runs
 * under the caller's identity, so each tool is checked against that user's own permissions.
 */
class AiChatUseCaseImpl implements Abstraction.Interface {
    constructor(
        private readonly ai: Ai.Interface,
        private readonly aiSdkTools: AiSdkTools.Interface,
        private readonly declarations: IAiSdkTool[],
        private readonly identityContext: IdentityContext.Interface,
        private readonly config: AiChatConfig.Interface,
        private readonly provider: AiChatProvider.Interface
    ) {}

    async execute(params: AiChatParams): Promise<AiChatResult> {
        const { request, writesEnabled } = await this.prepare(params);

        const result = await this.ai.generateText(request as never);

        return {
            text: this.extractText(result),
            toolCalls: this.extractToolCalls(result),
            steps: result.steps.length,
            pendingApprovals: this.extractPendingApprovals(result),
            messages: result.responseMessages,
            writesEnabled
        };
    }

    async *stream(params: AiChatParams): AsyncIterable<AiChatEvent> {
        let prepared;

        /*
         * An auth failure has to arrive as an event, not a thrown error: by the time a transport is
         * iterating this it has already committed to a 200 and a stream, so there is no status code
         * left to change.
         */
        try {
            prepared = await this.prepare(params);
        } catch (error) {
            yield { type: "error", message: toMessage(error) };
            return;
        }

        const { request, writesEnabled } = prepared;
        const pending: PendingApproval[] = [];

        try {
            const result = await this.ai.streamText(request as never);

            for await (const part of result.fullStream as AsyncIterable<StreamPart>) {
                if (part.type === "text-delta" && part.text) {
                    yield { type: "text", text: part.text };
                    continue;
                }

                if (part.type === "tool-call" && part.toolName) {
                    yield { type: "tool-call", name: part.toolName };
                    continue;
                }

                if (part.type === "tool-result" && part.toolName) {
                    yield { type: "tool-result", name: part.toolName };
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
                    yield { type: "error", message: toMessage(part.error) };
                    return;
                }
            }

            if (pending.length > 0) {
                yield { type: "approval", approvals: pending };
            }

            /*
             * Awaited only after the stream drains — these settle when the run finishes, so reading
             * them earlier would block the loop above and defeat the point of streaming.
             */
            yield {
                type: "done",
                messages: await result.response.then(response => response.messages),
                steps: (await result.steps).length,
                writesEnabled
            };
        } catch (error) {
            yield { type: "error", message: toMessage(error) };
        }
    }

    /**
     * Everything both entry points need: the identity check, which tools may run unattended, and the
     * fully-formed model request. Shared so streaming and buffered runs cannot drift apart.
     */
    private async prepare(params: AiChatParams): Promise<{
        request: Record<string, unknown>;
        writesEnabled: boolean;
    }> {
        if (this.identityContext.getIdentity().isAnonymous()) {
            throw new NotAuthorizedError();
        }

        const tools = this.aiSdkTools.getToolSet();
        const readOnlyNames = new Set(
            this.declarations.filter(isReadOnly).map(declaration => declaration.name)
        );

        /*
         * Without a signing secret we cannot prove an approval belongs to the call it was issued for,
         * so mutating tools are withheld entirely rather than gated on an unverifiable claim.
         */
        const writesEnabled = Boolean(this.config.approvalSecret);
        const toolNames = Object.keys(tools);
        const activeTools = writesEnabled
            ? toolNames
            : toolNames.filter(name => readOnlyNames.has(name));

        const messages = [...params.messages];
        if (params.decisions.length > 0) {
            messages.push(toApprovalMessage(params.decisions));
        }

        const provider = await this.provider.resolve();
        const [providerId] = provider.model.split("/");

        /*
         * An absent apiKey is meaningful: the provider's SDK factory then falls back to its own
         * environment variable. Only a configured provider (e.g. AI Power-Ups) supplies one here.
         */
        const connection: { sdkName: string; apiKey?: string } = { sdkName: providerId };
        if (provider.apiKey) {
            connection.apiKey = provider.apiKey;
        }

        const request: Record<string, unknown> = {
            model: provider.model,
            connection,
            system: SYSTEM_PROMPT,
            messages,
            tools,
            activeTools,
            toolChoice: "auto",
            toolApproval: ({ toolCall }: { toolCall: { toolName: string } }) => {
                return readOnlyNames.has(toolCall.toolName) ? "not-applicable" : "user-approval";
            },
            stopWhen: stepCountIs(this.config.maxSteps)
        };

        if (this.config.approvalSecret) {
            request["experimental_toolApprovalSecret"] = this.config.approvalSecret;
        }

        return { request, writesEnabled };
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

export const AiChatUseCase = Abstraction.createImplementation({
    implementation: AiChatUseCaseImpl,
    dependencies: [
        Ai,
        AiSdkTools,
        [AiSdkTool, { multiple: true }],
        IdentityContext,
        AiChatConfig,
        AiChatProvider
    ]
});
