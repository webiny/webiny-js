// CMS and Website Builder revision ids are `<id>#<version>`; the target id is the part before.
export const getTargetIdFromRevisionId = (revisionId: string): string => {
    const index = revisionId.indexOf("#");
    if (index === -1) {
        return revisionId;
    }
    return revisionId.slice(0, index);
};
