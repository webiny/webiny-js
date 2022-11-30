export interface SaveBlockActionArgsType {
    debounce?: boolean;
    onFinish?: () => void;
}

export interface ToggleBlockDirtyStateActionArgsType {
    dirty: boolean;
}
