const WBY_ACO_PREFIX = "wby-aco-";
/**
 * 006
 * PageDataMigration in ddb-es and ddb
 */

export const attachAcoRecordPrefix = (id: string) => {
    if (id.startsWith(WBY_ACO_PREFIX)) {
        return id;
    }
    return `${WBY_ACO_PREFIX}${id}`;
};

export const removeAcoRecordPrefix = (id: string) => {
    if (id.startsWith(WBY_ACO_PREFIX) === false) {
        return id;
    }
    return id.substring(WBY_ACO_PREFIX.length);
};
