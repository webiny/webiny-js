/** A pool recipient with the step's candidate teams they are in, in step order. */
export interface PoolGroupRecipient {
    id: string;
    teamIds: string[];
}

/** The recipients that share one set of teams. */
export interface PoolRecipientGroup<T extends PoolGroupRecipient> {
    /** The team ids of the group, in the order of the first recipient that has them. */
    teamIds: string[];
    recipients: T[];
}

/**
 * Groups pool recipients by their team set, so every group gets one message naming its teams.
 * The set is compared without regard to order; groups keep the order in which their first
 * recipient appears, and recipients keep their own order. Pure.
 */
export const groupPoolRecipients = <T extends PoolGroupRecipient>(
    recipients: T[]
): PoolRecipientGroup<T>[] => {
    const groups = new Map<string, PoolRecipientGroup<T>>();
    for (const recipient of recipients) {
        const teamIds = [...new Set(recipient.teamIds)];
        const key = JSON.stringify([...teamIds].sort());
        const group = groups.get(key);
        if (group) {
            group.recipients.push(recipient);
            continue;
        }
        groups.set(key, { teamIds, recipients: [recipient] });
    }
    return [...groups.values()];
};
