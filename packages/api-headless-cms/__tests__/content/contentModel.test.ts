import { DocumentClient } from "aws-sdk/clients/dynamodb";
import mdbid from "mdbid";
import { useContentGqlHandler } from "../useContentGqlHandler";
import { DbItemTypes } from "@webiny/api-headless-cms/common/dbItemTypes";
import { CmsContentModelType } from "@webiny/api-headless-cms/types";

const createModel = async (documentClient: DocumentClient): Promise<CmsContentModelType> => {
    const model: CmsContentModelType = {
        id: mdbid(),
        title: "model",
        group: "group",
        code: "model",
        createdOn: new Date(),
        createdBy: {
            id: "1234567890",
            name: "userName123"
        },
        fields: []
    };
    await documentClient
        .put({
            TableName: "HeadlessCms",
            Item: {
                PK: "contentModel#pk",
                SK: model.id,
                TYPE: DbItemTypes.CMS_CONTENT_MODEL,
                ...model
            }
        })
        .promise();
    return model;
};

describe("dynamic content model test", () => {
    const { getContentModelQuery, documentClient } = useContentGqlHandler();

    test("fetch content model", async () => {
        const model = await createModel(documentClient);

        const [response] = await getContentModelQuery({
            id: 1
        });
        console.log(response);
        expect(response).toEqual({
            data: {
                cms: {
                    getContentModel: {
                        data: model,
                        error: null
                    }
                }
            }
        });
    });
});
