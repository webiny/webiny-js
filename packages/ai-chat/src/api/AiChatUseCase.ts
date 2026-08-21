import { stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { AiChatConfig } from "./abstractions.js";
import { AiChatUseCase as Abstraction } from "./abstractions.js";
import type { AiChatParams } from "./abstractions.js";
import type { AiChatResult } from "./abstractions.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { isReadOnly } from "./approvals.js";
import { toPendingApproval } from "./approvals.js";
import type { ApprovalDecision } from "./approvals.js";
import type { PendingApproval } from "./approvals.js";

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
        private readonly config: AiChatConfig.Interface
    ) {}

    async execute(params: AiChatParams): Promise<AiChatResult> {
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

        const [providerId] = this.config.model.split("/");

        const request: Record<string, unknown> = {
            model: this.config.model,
            /*
             * No apiKey: the provider factory falls back to its environment variable, so the key never
             * travels through a request or gets stored per tenant.
             */
            connection: { sdkName: providerId },
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
    dependencies: [Ai, AiSdkTools, [AiSdkTool, { multiple: true }], IdentityContext, AiChatConfig]
});
