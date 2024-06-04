export const createTypeDefs = (models: [string, ...string[]]): string => {
    return /* GraphQL */ `
        type StartExportContentEntriesResponseData {
            url: String!
            total: Int!
        }

        type StartExportContentEntriesResponse {
            data: StartExportContentEntriesResponseData
            error: CmsError
        }

        type AbortExportContentEntriesResponse {
            data: Boolean
            error: CmsError
        }
        
        enum ExportContentEntriesModelsListEnum {
            ${models.join("\n")}
        }

        extend type Mutation {
            startExportContentEntries(modelId: ExportContentEntriesModelsListEnum!): StartExportContentEntriesResponse!
            abortExportContentEntries(id: ID!): AbortExportContentEntriesResponse!
        }
    `;
};
