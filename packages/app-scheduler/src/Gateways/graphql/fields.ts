export const createSchedulerEntryFields = (): string => {
    return `
        id
        targetId
        namespace
        scheduledBy {
            id
            displayName
            type
        }
        publishOn
        unpublishOn
        actionType
        title
    `;
};
