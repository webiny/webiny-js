export const createCustomAppsSchemaSnapshot = () => {
    return `
        type AcoSearchRecordCustomTestingApp_Location {
          folderId: String
        }
        
        input AcoSearchRecordCustomTestingApp_LocationWhereInput {
          folderId: String
          folderId_not: String
          folderId_in: [String]
          folderId_not_in: [String]
          folderId_contains: String
          folderId_not_contains: String
          folderId_startsWith: String
          folderId_not_startsWith: String
        }
        
        type AcoSearchRecordCustomTestingApp_Data_Identity {
          id: String
          displayName: String
          type: String
        }
        
        input AcoSearchRecordCustomTestingApp_Data_IdentityWhereInput {
          id: String
          id_not: String
          id_in: [String]
          id_not_in: [String]
          id_contains: String
          id_not_contains: String
          id_startsWith: String
          id_not_startsWith: String
        
          displayName: String
          displayName_not: String
          displayName_in: [String]
          displayName_not_in: [String]
          displayName_contains: String
          displayName_not_contains: String
          displayName_startsWith: String
          displayName_not_startsWith: String
        
          type: String
          type_not: String
          type_in: [String]
          type_not_in: [String]
          type_contains: String
          type_not_contains: String
          type_startsWith: String
          type_not_startsWith: String
        }
        
        type AcoSearchRecordCustomTestingApp_Data {
          someText: String
          identity: AcoSearchRecordCustomTestingApp_Data_Identity
          customCreatedOn: DateTime
          customVersion: Number
          customLocked: Boolean
          customWebinyTextField: String
          customWebinyNumberField: Number
        }
        
        input AcoSearchRecordCustomTestingApp_DataWhereInput {
          someText: String
          someText_not: String
          someText_in: [String]
          someText_not_in: [String]
          someText_contains: String
          someText_not_contains: String
          someText_startsWith: String
          someText_not_startsWith: String
        
          identity: AcoSearchRecordCustomTestingApp_Data_IdentityWhereInput
        
          customCreatedOn: DateTime
          customCreatedOn_not: DateTime
          customCreatedOn_in: [DateTime]
          customCreatedOn_not_in: [DateTime]
          customCreatedOn_lt: DateTime
          customCreatedOn_lte: DateTime
          customCreatedOn_gt: DateTime
          customCreatedOn_gte: DateTime
        
          customVersion: Number
          customVersion_not: Number
          customVersion_in: [Number]
          customVersion_not_in: [Number]
          customVersion_lt: Number
          customVersion_lte: Number
          customVersion_gt: Number
          customVersion_gte: Number
          # there must be two numbers sent in the array
          customVersion_between: [Number!]
          # there must be two numbers sent in the array
          customVersion_not_between: [Number!]
        
          customLocked: Boolean
          customLocked_not: Boolean
        
          customWebinyTextField: String
          customWebinyTextField_not: String
          customWebinyTextField_in: [String]
          customWebinyTextField_not_in: [String]
          customWebinyTextField_contains: String
          customWebinyTextField_not_contains: String
          customWebinyTextField_startsWith: String
          customWebinyTextField_not_startsWith: String
        
          customWebinyNumberField: Number
          customWebinyNumberField_not: Number
          customWebinyNumberField_in: [Number]
          customWebinyNumberField_not_in: [Number]
          customWebinyNumberField_lt: Number
          customWebinyNumberField_lte: Number
          customWebinyNumberField_gt: Number
          customWebinyNumberField_gte: Number
          # there must be two numbers sent in the array
          customWebinyNumberField_between: [Number!]
          # there must be two numbers sent in the array
          customWebinyNumberField_not_between: [Number!]
        }
        
        type AcoSearchRecordCustomTestingApp {
          id: ID!
          createdOn: DateTime!
          modifiedOn: DateTime
          savedOn: DateTime!
          createdBy: AcoUser!
          modifiedBy: AcoUser
          savedBy: AcoUser!
          type: String
          title: String
          content: String
          location: AcoSearchRecordCustomTestingApp_Location
          data: AcoSearchRecordCustomTestingApp_Data
          tags: [String]
        }
        
        input AcoSearchRecordCustomTestingApp_LocationInput {
          folderId: String
        }
        
        input AcoSearchRecordCustomTestingApp_Data_IdentityInput {
          id: String
          displayName: String
          type: String
        }
        
        input AcoSearchRecordCustomTestingApp_DataInput {
          someText: String
          identity: AcoSearchRecordCustomTestingApp_Data_IdentityInput
          customCreatedOn: DateTime
          customVersion: Number
          customLocked: Boolean
          customWebinyTextField: String
          customWebinyNumberField: Number
        }
        
        input AcoSearchRecordCustomTestingAppCreateInput {
          id: ID
          type: String
          title: String
          content: String
          location: AcoSearchRecordCustomTestingApp_LocationInput
          data: AcoSearchRecordCustomTestingApp_DataInput
          tags: [String!]
        }
        
        input AcoSearchRecordCustomTestingAppUpdateInput {
          title: String
          content: String
          location: AcoSearchRecordCustomTestingApp_LocationInput
          data: AcoSearchRecordCustomTestingApp_DataInput
          tags: [String!]
        }
        
        type AcoSearchRecordCustomTestingAppResponse {
          data: AcoSearchRecordCustomTestingApp
          error: AcoError
        }
        
        input AcoSearchRecordCustomTestingAppListWhereInput {
          id: ID
          id_not: ID
          id_in: [ID!]
          id_not_in: [ID!]
          entryId: String
          entryId_not: String
          entryId_in: [String!]
          entryId_not_in: [String!]
          createdOn: DateTime
          createdOn_gt: DateTime
          createdOn_gte: DateTime
          createdOn_lt: DateTime
          createdOn_lte: DateTime
          createdOn_between: [DateTime!]
          createdOn_not_between: [DateTime!]
          modifiedOn: DateTime
          modifiedOn_gt: DateTime
          modifiedOn_gte: DateTime
          modifiedOn_lt: DateTime
          modifiedOn_lte: DateTime
          modifiedOn_between: [DateTime!]
          modifiedOn_not_between: [DateTime!]
          savedOn: DateTime
          savedOn_gt: DateTime
          savedOn_gte: DateTime
          savedOn_lt: DateTime
          savedOn_lte: DateTime
          savedOn_between: [DateTime!]
          savedOn_not_between: [DateTime!]
          deletedOn: DateTime
          deletedOn_gt: DateTime
          deletedOn_gte: DateTime
          deletedOn_lt: DateTime
          deletedOn_lte: DateTime
          deletedOn_between: [DateTime!]
          deletedOn_not_between: [DateTime!]
          restoredOn: DateTime
          restoredOn_gt: DateTime
          restoredOn_gte: DateTime
          restoredOn_lt: DateTime
          restoredOn_lte: DateTime
          restoredOn_between: [DateTime!]
          restoredOn_not_between: [DateTime!]
          firstPublishedOn: DateTime
          firstPublishedOn_gt: DateTime
          firstPublishedOn_gte: DateTime
          firstPublishedOn_lt: DateTime
          firstPublishedOn_lte: DateTime
          firstPublishedOn_between: [DateTime!]
          firstPublishedOn_not_between: [DateTime!]
          lastPublishedOn: DateTime
          lastPublishedOn_gt: DateTime
          lastPublishedOn_gte: DateTime
          lastPublishedOn_lt: DateTime
          lastPublishedOn_lte: DateTime
          lastPublishedOn_between: [DateTime!]
          lastPublishedOn_not_between: [DateTime!]
          createdBy: ID
          createdBy_not: ID
          createdBy_in: [ID!]
          createdBy_not_in: [ID!]
          modifiedBy: ID
          modifiedBy_not: ID
          modifiedBy_in: [ID!]
          modifiedBy_not_in: [ID!]
          savedBy: ID
          savedBy_not: ID
          savedBy_in: [ID!]
          savedBy_not_in: [ID!]
          deletedBy: ID
          deletedBy_not: ID
          deletedBy_in: [ID!]
          deletedBy_not_in: [ID!]
          restoredBy: ID
          restoredBy_not: ID
          restoredBy_in: [ID!]
          restoredBy_not_in: [ID!]
          firstPublishedBy: ID
          firstPublishedBy_not: ID
          firstPublishedBy_in: [ID!]
          firstPublishedBy_not_in: [ID!]
          lastPublishedBy: ID
          lastPublishedBy_not: ID
          lastPublishedBy_in: [ID!]
          lastPublishedBy_not_in: [ID!]
          revisionCreatedOn: DateTime
          revisionCreatedOn_gt: DateTime
          revisionCreatedOn_gte: DateTime
          revisionCreatedOn_lt: DateTime
          revisionCreatedOn_lte: DateTime
          revisionCreatedOn_between: [DateTime!]
          revisionCreatedOn_not_between: [DateTime!]
          revisionModifiedOn: DateTime
          revisionModifiedOn_gt: DateTime
          revisionModifiedOn_gte: DateTime
          revisionModifiedOn_lt: DateTime
          revisionModifiedOn_lte: DateTime
          revisionModifiedOn_between: [DateTime!]
          revisionModifiedOn_not_between: [DateTime!]
          revisionSavedOn: DateTime
          revisionSavedOn_gt: DateTime
          revisionSavedOn_gte: DateTime
          revisionSavedOn_lt: DateTime
          revisionSavedOn_lte: DateTime
          revisionSavedOn_between: [DateTime!]
          revisionSavedOn_not_between: [DateTime!]
          revisionDeletedOn: DateTime
          revisionDeletedOn_gt: DateTime
          revisionDeletedOn_gte: DateTime
          revisionDeletedOn_lt: DateTime
          revisionDeletedOn_lte: DateTime
          revisionDeletedOn_between: [DateTime!]
          revisionDeletedOn_not_between: [DateTime!]
          revisionRestoredOn: DateTime
          revisionRestoredOn_gt: DateTime
          revisionRestoredOn_gte: DateTime
          revisionRestoredOn_lt: DateTime
          revisionRestoredOn_lte: DateTime
          revisionRestoredOn_between: [DateTime!]
          revisionRestoredOn_not_between: [DateTime!]
          revisionFirstPublishedOn: DateTime
          revisionFirstPublishedOn_gt: DateTime
          revisionFirstPublishedOn_gte: DateTime
          revisionFirstPublishedOn_lt: DateTime
          revisionFirstPublishedOn_lte: DateTime
          revisionFirstPublishedOn_between: [DateTime!]
          revisionFirstPublishedOn_not_between: [DateTime!]
          revisionLastPublishedOn: DateTime
          revisionLastPublishedOn_gt: DateTime
          revisionLastPublishedOn_gte: DateTime
          revisionLastPublishedOn_lt: DateTime
          revisionLastPublishedOn_lte: DateTime
          revisionLastPublishedOn_between: [DateTime!]
          revisionLastPublishedOn_not_between: [DateTime!]
          revisionCreatedBy: ID
          revisionCreatedBy_not: ID
          revisionCreatedBy_in: [ID!]
          revisionCreatedBy_not_in: [ID!]
          revisionModifiedBy: ID
          revisionModifiedBy_not: ID
          revisionModifiedBy_in: [ID!]
          revisionModifiedBy_not_in: [ID!]
          revisionSavedBy: ID
          revisionSavedBy_not: ID
          revisionSavedBy_in: [ID!]
          revisionSavedBy_not_in: [ID!]
          revisionDeletedBy: ID
          revisionDeletedBy_not: ID
          revisionDeletedBy_in: [ID!]
          revisionDeletedBy_not_in: [ID!]
          revisionRestoredBy: ID
          revisionRestoredBy_not: ID
          revisionRestoredBy_in: [ID!]
          revisionRestoredBy_not_in: [ID!]
          revisionFirstPublishedBy: ID
          revisionFirstPublishedBy_not: ID
          revisionFirstPublishedBy_in: [ID!]
          revisionFirstPublishedBy_not_in: [ID!]
          revisionLastPublishedBy: ID
          revisionLastPublishedBy_not: ID
          revisionLastPublishedBy_in: [ID!]
          revisionLastPublishedBy_not_in: [ID!]
          status: String
          status_not: String
          status_in: [String!]
          status_not_in: [String!]
        
          type: String
          type_not: String
          type_in: [String]
          type_not_in: [String]
          type_contains: String
          type_not_contains: String
          type_startsWith: String
          type_not_startsWith: String
        
          title: String
          title_not: String
          title_in: [String]
          title_not_in: [String]
          title_contains: String
          title_not_contains: String
          title_startsWith: String
          title_not_startsWith: String
        
          content: String
          content_not: String
          content_in: [String]
          content_not_in: [String]
          content_contains: String
          content_not_contains: String
          content_startsWith: String
          content_not_startsWith: String
        
          location: AcoSearchRecordCustomTestingApp_LocationWhereInput
          data: AcoSearchRecordCustomTestingApp_DataWhereInput
        
          tags: String
          tags_not: String
          tags_in: [String]
          tags_not_in: [String]
          tags_contains: String
          tags_not_contains: String
          tags_startsWith: String
          tags_not_startsWith: String
        
          AND: [AcoSearchRecordCustomTestingAppListWhereInput!]
          OR: [AcoSearchRecordCustomTestingAppListWhereInput!]
        }
        
        type AcoSearchRecordCustomTestingAppListResponse {
          data: [AcoSearchRecordCustomTestingApp!]
          error: AcoError
          meta: AcoMeta
        }
        
        enum AcoSearchRecordCustomTestingAppListSorter {
          id_ASC
          id_DESC
          createdOn_ASC
          createdOn_DESC
          modifiedOn_ASC
          modifiedOn_DESC
          savedOn_ASC
          savedOn_DESC
          deletedOn_ASC
          deletedOn_DESC
          restoredOn_ASC
          restoredOn_DESC
          firstPublishedOn_ASC
          firstPublishedOn_DESC
          lastPublishedOn_ASC
          lastPublishedOn_DESC
          revisionCreatedOn_ASC
          revisionCreatedOn_DESC
          revisionModifiedOn_ASC
          revisionModifiedOn_DESC
          revisionSavedOn_ASC
          revisionSavedOn_DESC
          revisionDeletedOn_ASC
          revisionDeletedOn_DESC
          revisionRestoredOn_ASC
          revisionRestoredOn_DESC
          revisionFirstPublishedOn_ASC
          revisionFirstPublishedOn_DESC
          revisionLastPublishedOn_ASC
          revisionLastPublishedOn_DESC
          type_ASC
          type_DESC
          title_ASC
          title_DESC
          content_ASC
          content_DESC
          tags_ASC
          tags_DESC
        }
        
        extend type SearchQuery {
          getAcoSearchRecordCustomTestingApp(
            id: ID!
          ): AcoSearchRecordCustomTestingAppResponse!
          listAcoSearchRecordCustomTestingApp(
            where: AcoSearchRecordCustomTestingAppListWhereInput
            search: String
            limit: Int
            after: String
            sort: [AcoSearchRecordCustomTestingAppListSorter!]
          ): AcoSearchRecordCustomTestingAppListResponse!
          listAcoSearchRecordCustomTestingAppTags(
            where: AcoSearchRecordTagListWhereInput
          ): AcoSearchRecordTagListResponse!
        }
        
        extend type SearchMutation {
          createAcoSearchRecordCustomTestingApp(
            data: AcoSearchRecordCustomTestingAppCreateInput!
          ): AcoSearchRecordCustomTestingAppResponse!
          updateAcoSearchRecordCustomTestingApp(
            id: ID!
            data: AcoSearchRecordCustomTestingAppUpdateInput!
          ): AcoSearchRecordCustomTestingAppResponse!
          moveAcoSearchRecordCustomTestingApp(
            id: ID!
            folderId: ID!
          ): AcoSearchRecordMoveResponse!
          deleteAcoSearchRecordCustomTestingApp(id: ID!): AcoBooleanResponse!
        }

    `;
};
