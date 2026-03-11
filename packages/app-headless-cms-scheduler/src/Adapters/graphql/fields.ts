export const createSchedulerEntryFields = (): string => {
    return `
        id
        targetId
        model {
            modelId
        }
        scheduledBy {
            id
            displayName
            type
        }
        publishOn
        unpublishOn
        type
        title
    `;
};
