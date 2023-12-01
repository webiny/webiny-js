import { useHandler } from "./utils/useHandler";
import {
    createMockApp,
    createMockAppCustomCreatedOnField,
    createMockAppCustomLockedField,
    createMockAppCustomVersionField,
    createMockAppIdentityField,
    createMockAppTextField,
    MOCK_APP_NAME
} from "./mocks/app";
import { AcoApp } from "~/apps";
import { createSearchModelDefinition, SEARCH_RECORD_MODEL_ID } from "~/record/record.model";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createAcoAppModifier } from "~/plugins";
import { IAcoAppRegisterParams } from "~/types";

describe("aco apps", () => {
    const { handler } = useHandler();

    it("should throw an error when requested app is missing", async () => {
        const context = await handler();

        let error: Error | undefined = undefined;
        try {
            context.aco.getApp(MOCK_APP_NAME);
        } catch (ex) {
            error = ex;
        }
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toEqual(`App "${MOCK_APP_NAME}" is not registered.`);
    });

    it("should construct a new app", async () => {
        const context = await handler();

        const app = await context.aco.registerApp(createMockApp());

        expect(app).toBeInstanceOf(AcoApp);

        const expectedModel: CmsModel = {
            ...createSearchModelDefinition({
                fields: [
                    createMockAppTextField(),
                    createMockAppIdentityField(),
                    createMockAppCustomCreatedOnField(),
                    createMockAppCustomVersionField(),
                    createMockAppCustomLockedField()
                ]
            }),
            name: `ACO - Search Record ${MOCK_APP_NAME}`,
            modelId: `${SEARCH_RECORD_MODEL_ID}-${MOCK_APP_NAME.toLowerCase()}`,
            tenant: "root",
            locale: "en-US",
            singularApiName: "AcoSearchRecordMockAppApiName",
            pluralApiName: "AcoSearchRecordMockAppApiName",
            group: expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                isPrivate: true
            }),
            isPlugin: true,
            isPrivate: true,
            tags: ["type:model"],
            webinyVersion: "0.0.0"
        };

        expect(app.model).toEqual(expectedModel);
    });

    it("should construct a new app and fetch it", async () => {
        const context = await handler();

        const createdApp = await context.aco.registerApp(createMockApp());
        const app = context.aco.getApp(MOCK_APP_NAME);

        expect(app).toBeInstanceOf(AcoApp);
        expect(createdApp).toEqual(app);
    });

    it("should add and remove custom fields in the app", async () => {
        const context = await handler();

        const createdApp = await context.aco.registerApp(createMockApp());

        createdApp.addField({
            id: "customField",
            fieldId: "customField",
            label: "Custom Field",
            type: "text",
            storageId: "text@customField"
        });
        const expected = [
            createMockAppTextField(),
            createMockAppIdentityField(),
            createMockAppCustomCreatedOnField(),
            createMockAppCustomVersionField(),
            createMockAppCustomLockedField(),
            {
                id: "customField",
                fieldId: "customField",
                label: "Custom Field",
                type: "text",
                storageId: "text@customField"
            }
        ];
        expect(createdApp.getFields()).toEqual(expected);
        const expectedModel: CmsModel = {
            ...createSearchModelDefinition({
                fields: [
                    createMockAppTextField(),
                    createMockAppIdentityField(),
                    createMockAppCustomCreatedOnField(),
                    createMockAppCustomVersionField(),
                    createMockAppCustomLockedField(),
                    {
                        id: "customField",
                        fieldId: "customField",
                        label: "Custom Field",
                        type: "text",
                        storageId: "text@customField"
                    }
                ]
            }),
            name: `ACO - Search Record ${MOCK_APP_NAME}`,
            modelId: `${SEARCH_RECORD_MODEL_ID}-${MOCK_APP_NAME.toLowerCase()}`,
            tenant: "root",
            locale: "en-US",
            singularApiName: "AcoSearchRecordMockAppApiName",
            pluralApiName: "AcoSearchRecordMockAppApiName",
            group: expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                isPrivate: true
            }),
            isPlugin: true,
            isPrivate: true,
            tags: ["type:model"],
            webinyVersion: "0.0.0"
        };

        expect(createdApp.model).toEqual(expectedModel);

        const appCheck1 = context.aco.getApp(MOCK_APP_NAME);
        expect(appCheck1.getFields()).toEqual(expected);

        appCheck1.removeField("customField");
        expect(appCheck1.getFields()).toEqual([
            createMockAppTextField(),
            createMockAppIdentityField(),
            createMockAppCustomCreatedOnField(),
            createMockAppCustomVersionField(),
            createMockAppCustomLockedField()
        ]);

        expect(createdApp.getFields()).toEqual([
            createMockAppTextField(),
            createMockAppIdentityField(),
            createMockAppCustomCreatedOnField(),
            createMockAppCustomVersionField(),
            createMockAppCustomLockedField()
        ]);

        const appCheck2 = context.aco.getApp(MOCK_APP_NAME);
        expect(appCheck2.getFields()).toEqual([
            createMockAppTextField(),
            createMockAppIdentityField(),
            createMockAppCustomCreatedOnField(),
            createMockAppCustomVersionField(),
            createMockAppCustomLockedField()
        ]);
    });

    it("should throw an error on duplicate app", async () => {
        const context = await handler();

        const createdApp = await context.aco.registerApp(createMockApp());
        expect(createdApp).toBeInstanceOf(AcoApp);

        let error: Error | undefined = undefined;
        try {
            await context.aco.registerApp(createMockApp());
        } catch (ex) {
            error = ex;
        }
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toEqual(
            `An app with the name "${MOCK_APP_NAME}" is already registered.`
        );
    });

    it("should throw an error when creating app with custom model without data field", async () => {
        const context = await handler();

        let error: Error | undefined = undefined;
        try {
            await context.aco.registerApp(
                createMockApp({
                    model: {
                        name: "Custom Model",
                        modelId: "customModelId",
                        description: "Custom Model Description",
                        singularApiName: "CustomModelApiName",
                        pluralApiName: "CustomModelApiName",
                        fields: [],
                        layout: [],
                        group: {
                            id: "customGroup",
                            name: "Custom Group"
                        },
                        tenant: "root",
                        locale: "en-US",
                        webinyVersion: "0.0.0",
                        isPrivate: true,
                        titleFieldId: "id"
                    }
                } as Partial<IAcoAppRegisterParams>)
            );
        } catch (ex) {
            error = ex;
        }
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toEqual(
            `The "data" field does not exist in model "customModelId-mockapp".`
        );
    });

    it("should add the custom field to the app via the plugin", async () => {
        const { handler } = useHandler({
            plugins: [
                createAcoAppModifier(MOCK_APP_NAME, async ({ addField }) => {
                    addField({
                        id: "customField",
                        fieldId: "customField",
                        label: "Custom Field",
                        type: "text",
                        storageId: "text@customField"
                    });
                })
            ]
        });

        const context = await handler();

        const app = await context.aco.registerApp(createMockApp());

        expect(app).toBeInstanceOf(AcoApp);
        expect(app.getFields()).toEqual([
            createMockAppTextField(),
            createMockAppIdentityField(),
            createMockAppCustomCreatedOnField(),
            createMockAppCustomVersionField(),
            createMockAppCustomLockedField(),
            {
                id: "customField",
                fieldId: "customField",
                label: "Custom Field",
                type: "text",
                storageId: "text@customField"
            }
        ]);
    });

    it("should remove the field to the app via the plugin", async () => {
        const { handler } = useHandler({
            plugins: [
                createAcoAppModifier(MOCK_APP_NAME, async ({ removeField }) => {
                    removeField("customCreatedOn");
                })
            ]
        });

        const context = await handler();

        const app = await context.aco.registerApp(createMockApp());

        expect(app).toBeInstanceOf(AcoApp);
        expect(app.getFields()).toEqual([
            createMockAppTextField(),
            createMockAppIdentityField(),
            createMockAppCustomVersionField(),
            createMockAppCustomLockedField()
        ]);
    });

    it("should modify the existing field", async () => {
        const { handler } = useHandler({
            plugins: [
                createAcoAppModifier(MOCK_APP_NAME, async ({ modifyField }) => {
                    modifyField("customCreatedOn", field => {
                        return {
                            ...field,
                            storageId: "date@customCreatedOn"
                        };
                    });
                })
            ]
        });

        const context = await handler();

        const app = await context.aco.registerApp(createMockApp());

        expect(app).toBeInstanceOf(AcoApp);
        expect(app.getFields()).toEqual([
            createMockAppTextField(),
            createMockAppIdentityField(),
            {
                ...createMockAppCustomCreatedOnField(),
                storageId: "date@customCreatedOn"
            },
            createMockAppCustomVersionField(),
            createMockAppCustomLockedField()
        ]);
    });

    it("should not modify the app with wrong modifier", async () => {
        const { handler } = useHandler({
            plugins: [
                createAcoAppModifier("NON_EXISTING_APP", async ({ removeField }) => {
                    removeField("createdOn");
                })
            ]
        });

        const context = await handler();

        const app = await context.aco.registerApp(createMockApp());

        expect(app).toBeInstanceOf(AcoApp);
        expect(app.getFields()).toEqual([
            createMockAppTextField(),
            createMockAppIdentityField(),
            createMockAppCustomCreatedOnField(),
            createMockAppCustomVersionField(),
            createMockAppCustomLockedField()
        ]);
    });
});
