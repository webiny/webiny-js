export interface SaveBlockActionArgsType {
    debounce?: boolean;
    onFinish?: () => void;
}

export interface ToggleSaveBlockStateActionArgsType {
    saving: boolean;
}
