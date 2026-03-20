export const stripConnectionFromException = (ex: any): any => {
    if (typeof ex !== "object") {
        return ex;
    }
    if (!ex?.meta?.meta?.connection) {
        return ex;
    }
    return {
        ...ex.meta,
        meta: {
            ...ex.meta.meta,
            connection: null
        }
    };
};
