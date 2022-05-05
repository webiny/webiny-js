/**
 * Not used anymore so ignore
 */
// @ts-nocheck
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { paginateBatch } from "../utils";
import { configurations } from "~/configurations";
import { DbContext } from "@webiny/handler-db/types";
import { FileManagerContext } from "~/types";

const plugin: UpgradePlugin<FileManagerContext & DbContext> = {
    name: "api-upgrade-file-manager",
    type: "api-upgrade",
    app: "file-manager",
    version: "5.0.0",
    async apply({ elasticsearch, fileManager, db }) {
        const limit = 1000;
        let hasMoreItems = true;
        let after = undefined;
        let esItems = [];

        while (hasMoreItems) {
            const response = await elasticsearch.search({
                index: "root-file-manager",
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
            name: "upgrade-file-manager-es-5.0.0.json",
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
                    ...items.map(item => ({
                        // @ts-ignore
                        ...configurations.esDb(),
                        data: {
                            PK: `T#root#L#${item._source.locale}#FM#F#${item._source.id}`,
                            SK: "A",
                            index: item._index,
                            data: item._source,
                            savedOn: new Date().toISOString(),
                            version: "5.0.0"
                        }
                    }))
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

        console.log(`Deleted old Elasticsearch items from "root-file-manager" index.`);

        if (errors) {
            console.warn("These items were not deleted", items);
        }
    }
};

export default plugin;

// Target _id: T#root#L#en-US#FM#F#603e248212ee4400089d16eb:A

// const record = {
//     _index: "root-file-manager",
//     _type: "_doc",
//     _id: "6040a6e2a6180e00085d168a",
//     _score: 1.0,
//     _source: {
//         id: "6040a6e2a6180e00085d168a",
//         createdOn: "2021-03-04T09:22:42.029Z",
//         key: "8klunupd0-004.jpg",
//         size: 412963,
//         type: "image/jpeg",
//         name: "8klunupd0-004.jpg",
//         tags: null,
//         createdBy: {
//             id: "admin@webiny.com",
//             displayName: "Pavel Denisjuk",
//             type: "admin"
//         },
//         meta: {
//             private: false
//         },
//         locale: "en-US"
//     }
// };
