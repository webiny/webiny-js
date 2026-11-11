import type { WorkflowEditorOptions } from "~/editor/presentation/editor/abstractions.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";

// The lists the editor presenter holds once everything loaded (each `ready`): the three step types
// (the AI editor exists), the Send webhook and Post to Slack automations, one transport, two models,
// two tools of which one changes content.
export const createEditorOptions = (
    overrides: Partial<WorkflowEditorOptions> = {}
): WorkflowEditorOptions => {
    return {
        stepTypes: { status: "ready", items: createStepTypes() },
        automations: {
            status: "ready",
            items: [
                createWebhookAutomation(),
                createAutomationDefinition({
                    id: "post-to-slack",
                    name: "Post to Slack",
                    models: ["cms.*"],
                    settingsSchema: null
                })
            ]
        },
        transports: {
            status: "ready",
            items: [
                createNotificationTransport({
                    id: "e-mail",
                    title: "E-mail",
                    description: "Sends an e-mail"
                })
            ]
        },
        aiModels: {
            status: "ready",
            items: [
                createAiModel({
                    id: "anthropic/claude-balanced",
                    name: "Claude Balanced",
                    providerId: "anthropic",
                    providerName: "Anthropic"
                }),
                createAiModel({
                    id: "openai/gpt-fast",
                    name: "GPT Fast",
                    providerId: "openai",
                    providerName: "OpenAI"
                })
            ]
        },
        aiTools: {
            status: "ready",
            items: [
                createAiTool({
                    name: "read-fields",
                    label: "Read fields",
                    summary: "Reads every field of the revision.",
                    changesContent: false
                }),
                createAiTool({
                    name: "update-fields",
                    label: "Update fields",
                    summary: "Edits field values in the revision.",
                    changesContent: true
                })
            ]
        },
        ...overrides
    };
};
