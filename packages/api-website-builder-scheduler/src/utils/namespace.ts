import type { IScheduledActionPayloadType } from "~/types.js";
import { SCHEDULED_ACTION_TYPES, WEBSITE_BUILDER_NAMESPACE } from "~/constants.js";

export const createNamespace = (type: IScheduledActionPayloadType) => {
    return `${WEBSITE_BUILDER_NAMESPACE}${type}`;
};

export const extractModelIdFromNamespace = (
    namespace: string
): IScheduledActionPayloadType | null => {
    if (!namespace.startsWith(WEBSITE_BUILDER_NAMESPACE)) {
        return null;
    }
    const value = namespace.substring(WEBSITE_BUILDER_NAMESPACE.length) || null;
    if (!value) {
        return null;
    }
    return SCHEDULED_ACTION_TYPES.includes(value as IScheduledActionPayloadType)
        ? (value as IScheduledActionPayloadType)
        : null;
};
