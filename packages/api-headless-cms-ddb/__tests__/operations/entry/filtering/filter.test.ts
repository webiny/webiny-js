import { createEntries } from "./mocks/entry";
import { createFilters } from "~/operations/entry/filtering/createFilters";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { Field } from "~/operations/entry/filtering/types";
import { createPluginsContainer } from "../../helpers/pluginsContainer";
import { createModel } from "../../helpers/createModel";
import { createFields } from "~/operations/entry/filtering/createFields";
import { filter } from "~/operations/entry/filtering";

describe("filtering", () => {
    let plugins: PluginsContainer;
    let model: CmsModel;
    let fields: Record<string, Field>;

    beforeEach(() => {
        plugins = createPluginsContainer();
        model = createModel();
        fields = createFields({
            plugins,
            model
        });
    });

    const filterByCreatedOn: [number, number][] = [
        [25, 75],
        [1, 99],
        [100, 0],
        [0, 100]
    ];

    it.each(filterByCreatedOn)(
        "should filter entries by createdOn - %s results",
        async (results, modifier) => {
            const records = createEntries(100).map(r => {
                // @ts-ignore
                delete r.values;

                return r;
            });

            const createdOn = new Date();
            /**
             * We want to filter out all the records which are not created after current date + modifier.
             * We reduce 5000ms from the time because test can be slower so results will be inconsistent.
             *
             */
            createdOn.setTime(createdOn.getTime() + modifier * 1000 * 86400 - 5000);

            const createFiltersParams = {
                plugins,
                where: {
                    createdOn_gte: createdOn.toISOString()
                },
                fields
            };

            /**
             * We want to make sure that filters are properly constructed
             */
            const filters = createFilters(createFiltersParams);
            expect(filters).toEqual([
                {
                    compareValue: createdOn.toISOString(),
                    field: expect.objectContaining({
                        fieldId: "createdOn"
                    }),
                    plugin: expect.objectContaining({
                        _params: {
                            matches: expect.any(Function),
                            operation: "gte"
                        },
                        name: expect.stringMatching(/dynamodb\.value\.filter\-/)
                    }),
                    negate: false,
                    path: "createdOn",
                    transformValue: expect.any(Function)
                }
            ]);

            const result = await filter({
                items: records as any,
                where: createFiltersParams.where,
                plugins,
                fields,
                fromStorage: (_, value) => {
                    return value;
                },
                fullTextSearch: {
                    term: "",
                    fields: []
                }
            });

            expect(result).toHaveLength(results);
        }
    );
});
