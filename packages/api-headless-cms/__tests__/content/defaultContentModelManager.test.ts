import mdbid from "mdbid";
import { useContentGqlHandler } from "../useContentGqlHandler";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DbItemTypes } from "@webiny/api-headless-cms/common/dbItemTypes";
import {
    CmsContentModelGroupType,
    CmsContentModelManagerInterface,
    ContentModelManagerPlugin
} from "@webiny/api-headless-cms/types";
import { createInitialEnvironment } from "../helpers";
import { plugins } from "@webiny/plugins";

type DummyModelType = {
    id: string;
    name: string;
    createdOn: Date;
    changedOn?: Date | null;
};
type DummyModelUpdateType = {
    name?: string;
};

const createContentModelGroup = async (
    documentClient: DocumentClient
): Promise<CmsContentModelGroupType> => {
    const environment = await createInitialEnvironment(documentClient);
    const model: CmsContentModelGroupType = {
        id: mdbid(),
        name: "group",
        description: "description",
        changedOn: null,
        createdBy: {
            id: "user123",
            name: "userName123"
        },
        createdOn: new Date(),
        environment,
        icon: "icon/icon",
        slug: "group-slug"
    };
    await documentClient
        .put({
            TableName: "HeadlessCms",
            Item: {
                PK: "pk#group",
                SK: model.id,
                TYPE: DbItemTypes.CMS_CONTENT_MODEL,
                ...model
            }
        })
        .promise();
    return model;
};

describe("DefaultContentModelManager tests - created via plugin", () => {
    const { documentClient } = useContentGqlHandler();
    const plugin = plugins.byName<ContentModelManagerPlugin>("content-model-manager-default");
    // TODO need to get either real context or create a dummy one
    const context: any = {};
    let manager: CmsContentModelManagerInterface<DummyModelType>;
    let contentModel;
    beforeEach(async () => {
        const group = await createContentModelGroup(documentClient);
        contentModel = {
            id: mdbid(),
            title: "model",
            code: "model",
            group,
            description: "description",
            createdOn: new Date(),
            changedOn: null,
            createdBy: {
                id: "user123",
                name: "userName123"
            },
            fields: []
        };
        manager = await plugin.create<DummyModelType>(context, contentModel);
    });

    it("should get content model target by id", async () => {
        const result = await manager.get("1234");

        expect(result).toMatchObject({
            id: /^([a-zA-Z0-9]+)$/,
            name: "model",
            createdOn: /^20/,
            changedOn: null
        });
    });

    it("should list content model target", async () => {
        const result = await manager.list();

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            id: /^([a-zA-Z0-9]+)$/,
            name: "model",
            createdOn: /^20/,
            changedOn: null
        });
    });

    it("should update content model target", async () => {
        const model = await manager.get("1234");

        const result = await manager.update<DummyModelUpdateType>({
            name: "modelUpdated"
        });

        expect(result).toEqual({
            ...model,
            name: "modelUpdated",
            changedOn: /^20/
        });

        const modelAfterUpdate = await manager.get("1234");
        expect(modelAfterUpdate).toEqual(result);
    });

    it("should delete content model target", async () => {
        const model = await manager.get("1234");

        const result = await manager.delete(model.id);
        expect(result).toEqual(true);

        const resultAfterDelete = await manager.get("1234");
        expect(resultAfterDelete).toBeNull();
    });
});
