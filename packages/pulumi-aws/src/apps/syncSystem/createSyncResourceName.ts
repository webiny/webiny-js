import kebabCase from "lodash/kebabCase";

/**
 * Need to have standardized resource names.
 */
export const createSyncResourceName = (name: string) => {
    return `sync-system-${kebabCase(name)}`;
};
