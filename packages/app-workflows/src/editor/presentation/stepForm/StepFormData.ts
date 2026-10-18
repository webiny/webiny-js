// The values of each step form, as `form.getData()` returns them (an untouched text field is null).

export interface CommonFormValues {
    title: string | null;
    color: string | null;
    description: string | null;
    notifications: string[] | null;
}

export interface PeopleFormValues extends CommonFormValues {
    teams: string[] | null;
}

export interface AutomationFormValues extends CommonFormValues {
    automationId: string | null;
    settings: Record<string, unknown> | null;
}

export interface AiFormValues extends CommonFormValues {
    instructions: string | null;
    model: string | null;
    tools: string[] | null;
}
