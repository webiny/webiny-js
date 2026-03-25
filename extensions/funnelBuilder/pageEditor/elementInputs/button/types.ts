export interface ButtonActionDto {
    id: string;
    type: string;
    extra: Record<string, unknown>;
}

export interface ButtonInputs {
    actions: ButtonActionDto[];
    label: string;
}

export interface ButtonActionDefinition {
    type: string;
    name: string;
    description?: string;
    /* If set, the button label will be updated to this value when the action is added. */
    updateButtonLabel?: string;
    /* If not provided, the action can always be added. */
    canAdd?: (params: { actions: ButtonActionDto[] }) => boolean;
    /* Default extra data for the action. */
    extra?: Record<string, unknown>;
}
