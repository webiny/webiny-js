import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createEditorStep } from "~/editor/testing/editorFixtures.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";

export const SETTINGS_SCHEMA: JsonSchema = {
    type: "object",
    description: "Sends the review and content to a URL when this step is reached.",
    properties: {
        url: { type: "string", title: "URL" },
        timeout: { type: "number", title: "Timeout (seconds)", minimum: 1, maximum: 120 }
    },
    required: ["url"]
};

// A People step: id `step-1`, team `team-1`, the review defaults, `e-mail` ticked.
export const createReviewStep = (overrides: Partial<EditorStep> = {}): EditorStep => {
    return createEditorStep({ title: "Legal sign-off", ...overrides });
};

export const createAutomationStep = (overrides: Partial<EditorStep> = {}): EditorStep => {
    return createEditorStep({
        id: "step-2",
        title: "Notify the CRM",
        type: "automation",
        notificationIds: [],
        config: { automationId: "send-webhook", settings: { url: "https://example.com/hook" } },
        ...overrides
    });
};

// An AI step on the default model of `createAiModel` (`openai/gpt-4o`, "GPT-4o").
export const createAiStep = (overrides: Partial<EditorStep> = {}): EditorStep => {
    return createEditorStep({
        id: "step-3",
        title: "Tone check",
        type: "ai",
        notificationIds: [],
        config: {
            instructions: "Check the tone of voice.",
            model: "openai/gpt-4o",
            tools: ["readContent"]
        },
        ...overrides
    });
};

// The three types as the server lists them; `ai` has a config schema, so the AI editor exists.
export const createStepTypes = (): EditorStepType[] => {
    return [
        createEditorStepType({ type: "review", title: "Review", configSchema: { type: "object" } }),
        createEditorStepType({ type: "ai", title: "AI", configSchema: { type: "object" } }),
        createEditorStepType({
            type: "automation",
            title: "Automation",
            configSchema: { type: "object" }
        })
    ];
};

// Covers every model and has the settings schema above.
export const createWebhookAutomation = (
    overrides: Partial<AutomationDefinition> = {}
): AutomationDefinition => {
    return createAutomationDefinition({
        id: "send-webhook",
        name: "Send webhook",
        models: ["*"],
        settingsSchema: SETTINGS_SCHEMA,
        ...overrides
    });
};
