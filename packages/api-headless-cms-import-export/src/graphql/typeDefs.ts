import { NonEmptyArray } from "@webiny/api/types";

export const createTypeDefs = (models: NonEmptyArray<string>): string => {
    return /* GraphQL */ `
        enum ExportContentEntriesExportRecordStatusEnum {
            pending
            running
            failed
            success
            aborted
        }
        
        type ExportContentEntriesExportRecordFile {
            get: String!
            head: String!
            key: String!
            type: String!
            checksum: String!
        }
        
        type ExportContentEntriesExportRecord {
            id: ID!
            createdOn: DateTime!
            createdBy: CmsIdentity!
            finishedOn: DateTime
            modelId: String!
            files: [ExportContentEntriesExportRecordFile!]
            exportAssets: Boolean!
            status: ExportContentEntriesExportRecordStatusEnum!
        }
        
        type ExportContentEntriesResponse {
            data: ExportContentEntriesExportRecord
            error: CmsError
        }
        
        type ListExportContentEntriesExportRecord {
            id: ID!
            createdOn: DateTime!
            createdBy: CmsIdentity!
            finishedOn: DateTime
            modelId: String!
            exportAssets: Boolean!
            status: ExportContentEntriesExportRecordStatusEnum!
        }
        
        type ListExportContentEntriesResponse {
            data: [ListExportContentEntriesExportRecord!]
            meta: CmsListMeta
            error: CmsError
        }

        type AbortExportContentEntriesResponse {
            data: ExportContentEntriesExportRecord
            error: CmsError
        }
        
        type ValidateImportFromUrlResponseDataFileError {
            message: String!
            data: JSON
        }
        
        type ValidateImportFromUrlResponseDataFile {
            get: String
            head: String
            type: String
            checksum: String
            size: Number
            checked: Boolean
            error: ValidateImportFromUrlResponseDataFileError
        }
        
        type ValidateImportFromUrlResponseData {
            id: ID!
            files: [ValidateImportFromUrlResponseDataFile!]
            status: String!
            error: CmsError
        }
        
        type GetValidateImportFromUrlResponseData {
            id: ID!
            files: [ValidateImportFromUrlResponseDataFile!]
            status: String!
            error: CmsError
        }
        
        type GetValidateImportFromUrlResponse {
            data: GetValidateImportFromUrlResponseData
            error: CmsError
        }
        
        type ValidateImportFromUrlResponse {
            data: ValidateImportFromUrlResponseData
            error: CmsError
        }
        
        type ImportFromUrlResponseDataFileError {
            message: String!
            data: JSON
        }
        
        type ImportFromUrlResponseDataFile {
            get: String!
            head: String!
            type: String!
            checksum: String!
            size: Number!
            error: ImportFromUrlResponseDataFileError
        }
        
        type ImportFromUrlResponseData {
            id: ID!
            files: [ImportFromUrlResponseDataFile!]
            status: String!
        }
        
        type ImportFromUrlResponse {
            data: ImportFromUrlResponseData
            error: CmsError
        }
        
        enum ExportContentEntriesModelsListEnum {
            ${models.join("\n")}
        }
        
        extend type Query {
            getExportContentEntries(id: ID!): ExportContentEntriesResponse!
            listExportContentEntries(after: String, limit: Int): ListExportContentEntriesResponse!
            getValidateImportFromUrl(id: ID!): GetValidateImportFromUrlResponse!
            getImportFromUrl(id: ID!): ImportFromUrlResponse!
        }

        extend type Mutation {
            exportContentEntries(
                modelId: ExportContentEntriesModelsListEnum!
                # limit on how much entries will be fetched in a single batch - mostly used for testing
                limit: Int
                # do we export assets as well? default is false
                exportAssets: Boolean
            ): ExportContentEntriesResponse!
            abortExportContentEntries(id: ID!): AbortExportContentEntriesResponse!
            validateImportFromUrl(data: String!): ValidateImportFromUrlResponse!
            # the id is a task id returned from the validateImportFromUrl mutation
            # it will be used to get the file information and start a new task for the actual import
            importFromUrl(id: ID!): ImportFromUrlResponse!
        }
    `;
};
