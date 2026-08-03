/** Runtime kill-switch key. Experiment entryIds are globally unique, so this is tenant-safe. */
export const experimentPauseKey = (experimentEntryId: string): string => {
    return `WbExperimentPaused:${experimentEntryId}`;
};
