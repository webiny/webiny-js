/**
 * !!! DO NOT CHANGE THIS !!!
 * If this is changed, you will need to create new migration which changes the IDs for the users.
 *
 * packages/migrations/src/migrations/5.35.0/006/ddb/PageDataMigration.ts:236
 * packages/migrations/src/migrations/5.35.0/006/ddb-es/PageDataMigration.ts:419
 */
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
