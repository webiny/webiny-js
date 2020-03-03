import { graphql } from "graphql";
import contentModels from "./contentModels";

export default async testing => {
    const mutation = /* GraphQL */ `
        mutation CreateContentModel($data: CmsContentModelInput!) {
            cmsManage {
                createContentModel(data: $data) {
                    data {
                        id
                        modelId
                    }
                    error {
                        code
                        data
                        message
                    }
                }
            }
        }
    `;

    for (let i = 0; i < contentModels.length; i++) {
        await graphql(testing.schema, mutation, {}, testing.context, { data: contentModels[i] });
    }
};
