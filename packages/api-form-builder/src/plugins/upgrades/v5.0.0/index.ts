import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { FormBuilderContext } from "../../../types";
import { paginateBatch } from "../utils";
import defaults from "../../crud/defaults";

const plugin: UpgradePlugin<FormBuilderContext> = {
    name: "api-upgrade-form-builder",
    type: "api-upgrade",
    app: "form-builder",
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
            name: "upgrade-form-builder-es-5.0.0.json",
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
                        if (item._source.__type === "fb.form") {
                            const [uniqueId] = item._source.id.split("#");
                            return {
                                ...defaults.esDb,
                                data: {
                                    PK: `T#root#L#${item._source.locale}#FB#F#${uniqueId}`,
                                    SK: "L",
                                    index: item._index,
                                    data: item._source,
                                    savedOn: new Date().toISOString(),
                                    version: "5.0.0"
                                }
                            };
                        }

                        // __type: "fb.submission"
                        return {
                            ...defaults.esDb,
                            data: {
                                PK: `T#root#L#${item._source.locale}#FB#F#${item._source.form.parent}`,
                                SK: `FS#${item._source.id}`,
                                index: item._index,
                                data: item._source,
                                savedOn: new Date().toISOString()
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

        console.log(`Deleted old Elasticsearch items from "root-form-builder" index.`);

        if (errors) {
            console.warn("These items were not deleted", items);
        }
    }
};

export default plugin;

// Target _id: T#root#L#en-US#FB#F#603e248212ee4400089d16eb:L

// const record = {
//     _index: "root-form-builder",
//     _type: "_doc",
//     _id: "FORM#L#6040a8a5a6180e00085d168e",
//     _score: 1.0,
//     _source: {
//         __type: "fb.form",
//         id: "6040a8a5a6180e00085d168e#0001",
//         createdOn: "2021-03-04T09:30:13.784Z",
//         savedOn: "2021-03-04T09:30:13.784Z",
//         name: "Test",
//         slug: "test-6040a8a5a6180e00085d168e",
//         published: false,
//         publishedOn: null,
//         version: 1,
//         locked: false,
//         status: "draft",
//         createdBy: {
//             id: "admin@webiny.com",
//             displayName: "Pavel Denisjuk",
//             type: "admin"
//         },
//         ownedBy: {
//             id: "admin@webiny.com",
//             displayName: "Pavel Denisjuk",
//             type: "admin"
//         },
//         locale: "en-US"
//     }
// };
