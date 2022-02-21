export interface SaveRevisionActionArgsType {
    debounce?: boolean;
    onFinish?: () => void;
}

export interface ToggleSaveRevisionStateActionArgsType {
    saving: boolean;
}
