export type SaveRevisionActionArgsType = {
    debounce?: boolean;
    onFinish?: () => void;
};

export type ToggleSaveRevisionStateActionArgsType = {
    saving: boolean;
};
