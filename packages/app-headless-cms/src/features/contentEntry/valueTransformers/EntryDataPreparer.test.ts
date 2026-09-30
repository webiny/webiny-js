import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { EntryDataPreparer } from "./EntryDataPreparer.js";
import { ValueTransformersFeature } from "./feature.js";
import {
    blocksField,
    formValues,
    graphQLInputValues,
    metaTitleField,
    pageModel,
    singleBlockField
} from "./entryValueFixtures.js";

describe("EntryDataPreparer", () => {
    let preparer: EntryDataPreparer.Interface;

    beforeEach(() => {
        const container = new Container();
        ValueTransformersFeature.register(container);
        preparer = container.resolve(EntryDataPreparer);
    });

    describe("prepare", () => {
        it("should convert dynamic zone values into the GraphQL input shape", () => {
            const result = preparer.prepare(formValues, pageModel.fields);

            expect(result).toEqual(graphQLInputValues);
        });

        it("should not send form-only keys of dynamic zone items", () => {
            const result = preparer.prepare(formValues, [blocksField]);

            const blocks = result.blocks as Record<string, unknown>[];
            for (const block of blocks) {
                expect(block).not.toHaveProperty("_templateId");
                expect(Object.keys(block)).toHaveLength(1);
            }
        });

        it("should convert a single (non-list) dynamic zone value", () => {
            const result = preparer.prepare({ featuredBlock: formValues.featuredBlock }, [
                singleBlockField
            ]);

            expect(result).toEqual({ featuredBlock: graphQLInputValues.featuredBlock });
        });

        it("should drop dynamic zone items with an unknown template", () => {
            const result = preparer.prepare(
                {
                    blocks: [
                        { _templateId: "removedBlock", _id: "x", title: "Gone" },
                        ...formValues.blocks
                    ]
                },
                [blocksField]
            );

            expect(result).toEqual({ blocks: graphQLInputValues.blocks });
        });

        it("should skip values of fields that are not in the model", () => {
            const result = preparer.prepare({ metaTitle: "Home", notAField: "value" }, [
                metaTitleField
            ]);

            expect(result).toEqual({ metaTitle: "Home" });
        });

        it("should keep null values", () => {
            const result = preparer.prepare({ blocks: null, metaTitle: null }, pageModel.fields);

            expect(result).toEqual({ blocks: null, metaTitle: null });
        });
    });

    describe("prepareEntryData", () => {
        it("should prepare values and keep the other keys", () => {
            const data = {
                values: formValues,
                wbyAco_location: { folderId: "root" }
            };

            const result = preparer.prepareEntryData(data, pageModel.fields);

            expect(result).toEqual({
                values: graphQLInputValues,
                wbyAco_location: { folderId: "root" }
            });
        });

        it("should not mutate the input data", () => {
            const data = { values: structuredClone(formValues) };

            preparer.prepareEntryData(data, pageModel.fields);

            expect(data).toEqual({ values: formValues });
        });

        it("should return data as is when there are no values", () => {
            const data = { wbyAco_location: { folderId: "root" } };

            expect(preparer.prepareEntryData(data, pageModel.fields)).toBe(data);
        });
    });
});
