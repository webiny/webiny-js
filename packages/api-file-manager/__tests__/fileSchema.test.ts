import { describe, expect, test } from "vitest";
import prettier from "prettier";
import { useHandler } from "./utils/useHandler.js";
import { createFilesTypeDefs } from "~/graphql/createFilesTypeDefs.js";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords.js";
import fileSdlSnapshot from "./mocks/fileWithoutExtensions.sdl.js";
import { createFileModelModifier } from "~/modelModifier/CmsModelModifier.js";

describe("File Model Modifier test", () => {
    test("should generate GraphQL schema for File model", async () => {
        const { handler } = useHandler({
            plugins: [
                // Add custom fields that will be assigned to the `extensions` object field.
                createFileModelModifier(({ modifier }) => {
                    modifier.addField({
                        id: "carMake",
                        fieldId: "carMake",
                        label: "Car Make",
                        type: "text",
                        listValidation: [],
                        validation: []
                    });

                    modifier.addField({
                        id: "year",
                        fieldId: "year",
                        label: "Year of manufacturing",
                        type: "number",
                        listValidation: [],
                        validation: []
                    });
                    modifier.addField({
                        id: "article",
                        fieldId: "article",
                        label: "Article",
                        type: "ref",
                        renderer: {
                            name: "ref-advanced-single"
                        },
                        settings: {
                            models: [
                                {
                                    modelId: "article"
                                }
                            ]
                        },
                        listValidation: [],
                        validation: []
                    });
                })
            ]
        });

        const context = await handler();

        const fileModel = await context.cms.getModel("fmFile");
        const models = await context.cms.listModels();
        const fieldPlugins = createFieldTypePluginRecords(context.plugins);

        const schema = createFilesTypeDefs({
            model: fileModel,
            models,
            plugins: fieldPlugins
        });

        const prettySnapshot = await prettier.format(fileSdlSnapshot.trim(), { parser: "graphql" });
        const fileSdl = await prettier.format(schema.trim(), { parser: "graphql" });

        expect(fileSdl).toEqual(prettySnapshot);
    });
});
