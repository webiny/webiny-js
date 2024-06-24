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
            expiresOn: DateTime
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
            data: ExportContentEntriesExportRecord
            error: CmsError
        }
        
        enum ExportContentEntriesModelsListEnum {
            ${models.join("\n")}
        }
        
        extend type Query {
            getExportContentEntries(id: ID!): ExportContentEntriesResponse!
        }

        extend type Mutation {
            startExportContentEntries(modelId: ExportContentEntriesModelsListEnum!, limit: Int): StartExportContentEntriesResponse!
            abortExportContentEntries(id: ID!): AbortExportContentEntriesResponse!
        }
    `;
};
