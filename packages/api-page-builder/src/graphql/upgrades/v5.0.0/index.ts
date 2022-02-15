/**
 * Not used so ts-ignore on non-existing import is correct.
 */
// @ts-nocheck
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { PbContext } from "../../../types";
import { paginateBatch } from "../utils";
import defaults from "../../crud/utils/defaults";

const plugin: UpgradePlugin<PbContext> = {
    name: "api-upgrade-page-builder",
    type: "api-upgrade",
    app: "page-builder",
    version: "5.0.0",
    async apply(context) {
        const { elasticsearch, fileManager, db } = context;
        const limit = 1000;
        let hasMoreItems = true;
        let after = undefined;
        let esItems = [];

        while (hasMoreItems) {
            const response = await elasticsearch.search({
                ...defaults.es(context),
                body: {
                    sort: {
                        createdOn: {
                            order: "asc",
                            // eslint-disable-next-line
                            unmapped_type: "date"
                        }
                    },
                    size: limit + 1,
                    after
                }
            });
            const { hits } = response.body.hits;

            hasMoreItems = hits.length > limit;
            after = hasMoreItems ? hits[limit - 1].sort : undefined;
            esItems = [...esItems, ...hits.filter(item => !item._id.includes("T#root#"))];
        }

        console.log(`Fetched ${esItems.length} items from Elasticsearch`);
        if (esItems.length === 0) {
            return;
        }

        // Store a backup of old items
        const esJSON = JSON.stringify(esItems);

        const { file } = await fileManager.storage.storagePlugin.upload({
            name: "upgrade-page-builder-es-5.0.0.json",
            type: "application/json",
            size: esJSON.length,
            buffer: Buffer.from(esJSON)
        });

        console.log(`Stored backup of Elasticsearch items to ${file.key}`);

        // Store items to ES DDB table
        await paginateBatch(esItems, 25, async items => {
            await db
                .batch()
                .create(
                    ...items.map(item => {
                        return {
                            ...defaults.esDb,
                            data: {
                                PK: `T#root#L#${item._source.locale}#PB#P#${item._source.pid}`,
                                SK: item._source.published === true ? "P" : "L",
                                index: item._index,
                                data: item._source,
                                savedOn: new Date().toISOString(),
                                version: "5.0.0"
                            }
                        };
                    })
                )
                .execute();
        });

        console.log(`Inserted items into Elasticsearch DynamoDB table.`);

        // Delete original items from ES index
        const operations = esItems.map(item => {
            return { delete: { _id: item._id, _index: item._index } };
        });

        const {
            body: { items, errors }
        } = await elasticsearch.bulk({
            body: operations,
            // eslint-disable-next-line
            filter_path: "errors,items.*.error"
        });

        console.log(`Deleted old Elasticsearch items from "root-page-builder" index.`);

        if (errors) {
            console.warn("These items were not deleted", items);
        }
    }
};

export default plugin;

// Target _id: T#root#L#en-US#PB#P#603e248312ee4400089d16ec:L
// Target _id: T#root#L#en-US#PB#P#603e248312ee4400089d16ec:P

// const record = {
//     _index: "root-page-builder",
//     _type: "_doc",
//     _id: "P#6026a3873d8f6b0009c67db6",
//     _score: 1.0,
//     _source: {
//         __type: "page",
//         id: "6026a3873d8f6b0009c67db6#0001",
//         pid: "6026a3873d8f6b0009c67db6",
//         editor: "page-builder",
//         locale: "en-US",
//         createdOn: "2021-02-12T15:49:27.077Z",
//         savedOn: "2021-02-12T15:49:27.417Z",
//         createdBy: {
//             type: "admin",
//             displayName: "Pavel Denisjuk",
//             id: "admin@webiny.com"
//         },
//         ownedBy: {
//             type: "admin",
//             displayName: "Pavel Denisjuk",
//             id: "admin@webiny.com"
//         },
//         category: "static",
//         version: 1,
//         title: "Welcome to Webiny",
//         titleLC: "welcome to webiny",
//         path: "/welcome-to-webiny",
//         status: "published",
//         locked: true,
//         publishedOn: "2021-02-12T15:49:27.560Z",
//         tags: [],
//         snippet: null,
//         images: {
//             general: null
//         },
//         published: true
//     }
// };
