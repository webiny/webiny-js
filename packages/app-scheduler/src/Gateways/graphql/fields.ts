export const createSchedulerEntryFields = (): string => {
    return `
        id
        targetId
        app
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
