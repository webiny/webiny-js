import DataLoader from "dataloader";
import {
    CmsContentEntry,
    CmsContentEntryStorageOperations,
    CmsContentModel,
    CmsContext
} from "../../../../types";

export const getAllEntryRevisions = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryStorageOperations
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        const args = ids.map(id => {
            return {
                where: {
                    id: id.includes("#") ? id.split("#").shift() : id
                }
            };
        });
        return await storageOperations.getMultiple(model, args);
        // const results = [];
        //
        // for (let i = 0; i < keys.length; i++) {
        //     const [entries] = await context.db.read({
        //         ...utils.defaults.db(),
        //         query: {
        //             PK: PK_ENTRY(keys[i]),
        //             SK: { $beginsWith: "REV#" }
        //         }
        //     });
        //
        //     results.push(entries);
        // }
        //
        // return results;
    });
};

export const getRevisionById = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryStorageOperations
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        const args = ids.map(id => {
            const [uniqueId, version] = id.split("#");
            return {
                where: {
                    id: uniqueId,
                    version: parseInt(version)
                }
            };
        });
        return await storageOperations.getMultiple(model, args);
        // const queries = keys.map(id => {
        //     const [entryId, version] = id.split("#");
        //     return {
        //         ...utils.defaults.db(),
        //         query: {
        //             PK: PK_ENTRY(entryId),
        //             SK: `REV#${version}`
        //         }
        //     };
        // });

        // const results = (await context.db
        //     .batch()
        //     .read(...queries)
        //     .execute()) as [CmsContentEntry[]][];

        // We're not filtering empty values here as we must return the same amount of items as the number of "keys".
        // return results.map(result => {
        //     if (Array.isArray(result) === false || Array.isArray(result[0]) === false) {
        //         return null;
        //     }
        //     return result[0][0];
        // });
    });
};

export const getPublishedRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryStorageOperations
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        const args = ids.map(id => {
            return {
                where: {
                    id,
                    published: true
                }
            };
        });
        return await storageOperations.getMultiple(model, args);
        // const entries = await context.db
        //     .batch()
        //     .read(
        //         ...keys.map(id => ({
        //             ...utils.defaults.db(),
        //             query: {
        //                 PK: PK_ENTRY(id),
        //                 SK: SK_PUBLISHED()
        //             }
        //         }))
        //     )
        //     .execute();
        //
        // return entries.map(result => result[0][0]);
    });
};

export const getLatestRevisionByEntryId = (
    context: CmsContext,
    model: CmsContentModel,
    storageOperations: CmsContentEntryStorageOperations
) => {
    return new DataLoader<string, CmsContentEntry>(async ids => {
        const args = ids.map(id => {
            return {
                where: {
                    id,
                    latest: true
                }
            };
        });
        return await storageOperations.getMultiple(model, args);
        // const entries = await context.db
        //     .batch()
        //     .read(
        //         ...keys.map(id => ({
        //             ...utils.defaults.db(),
        //             query: {
        //                 PK: PK_ENTRY(id),
        //                 SK: SK_LATEST()
        //             }
        //         }))
        //     )
        //     .execute();
        //
        // return entries.map(result => result[0][0]);
    });
};
