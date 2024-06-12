export const createTypeDefs = (models: [string, ...string[]]): string => {
    return /* GraphQL */ `
        
        type ExportContentEntriesExportRecord {
            id: ID!
            createdOn: DateTime!
            createdBy: CmsIdentity!
            finishedOn: DateTime
            modelId: String!
            file: String
            url: String
            status: String
        }
        
        type ExportContentEntriesResponse {
            data: ExportContentEntriesExportRecord
            error: CmsError
        }
        
        type StartExportContentEntriesResponse {
            data: ExportContentEntriesExportRecord
            error: CmsError
        }

        type AbortExportContentEntriesResponse {
            data: Boolean
            error: CmsError
        }
        
        enum ExportContentEntriesModelsListEnum {
            ${models.join("\n")}
        }
        
        extend type Query {
            getExportContentEntries(id: String!): ExportContentEntriesResponse!
        }

        extend type Mutation {
            startExportContentEntries(modelId: ExportContentEntriesModelsListEnum!): StartExportContentEntriesResponse!
            abortExportContentEntries(id: ID!): AbortExportContentEntriesResponse!
        }
    `;
};
