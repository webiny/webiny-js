// The names of the step form renderers, registered by `WorkflowEditorConfig` and used by the builders.
export const STEP_FORM_RENDERER = {
    colour: "workflowStepColour",
    teams: "workflowTeamsPicker",
    transports: "workflowTransports",
    automations: "workflowAutomationCards",
    aiModel: "workflowAiModel",
    aiTools: "workflowAiTools"
} as const;

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        workflowStepColour: { fieldType: "text"; settings: undefined };
        workflowTeamsPicker: { fieldType: "text"; settings: undefined };
        workflowTransports: { fieldType: "text"; settings: undefined };
        workflowAutomationCards: { fieldType: "text"; settings: undefined };
        workflowAiModel: { fieldType: "text"; settings: undefined };
        workflowAiTools: { fieldType: "text"; settings: undefined };
    }
}
