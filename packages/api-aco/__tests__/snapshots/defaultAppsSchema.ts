export const createDefaultAppsSchemaSnapshot = () => {
    return `
        type AcoSearchRecordWebiny_Location {
          folderId: String
        }
        
        input AcoSearchRecordWebiny_LocationWhereInput {
          folderId: String
          folderId_not: String
          folderId_in: [String]
          folderId_not_in: [String]
          folderId_contains: String
          folderId_not_contains: String
          folderId_startsWith: String
          folderId_not_startsWith: String
        }
        
        type AcoSearchRecordWebiny_Data_Identity {
          id: String
          displayName: String
          type: String
        }
        
        input AcoSearchRecordWebiny_Data_IdentityWhereInput {
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
        
        type AcoSearchRecordWebiny_Data {
          someText: String
          identity: AcoSearchRecordWebiny_Data_Identity
          customCreatedOn: DateTime
          customVersion: Number
          customLocked: Boolean
        }
        
        input AcoSearchRecordWebiny_DataWhereInput {
          someText: String
          someText_not: String
          someText_in: [String]
          someText_not_in: [String]
          someText_contains: String
          someText_not_contains: String
          someText_startsWith: String
          someText_not_startsWith: String
        
          identity: AcoSearchRecordWebiny_Data_IdentityWhereInput
        
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
        }
        
        type AcoSearchRecordWebiny {
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
          location: AcoSearchRecordWebiny_Location
          data: AcoSearchRecordWebiny_Data
          tags: [String]
        }
        
        input AcoSearchRecordWebiny_LocationInput {
          folderId: String
        }
        
        input AcoSearchRecordWebiny_Data_IdentityInput {
          id: String
          displayName: String
          type: String
        }
        
        input AcoSearchRecordWebiny_DataInput {
          someText: String
          identity: AcoSearchRecordWebiny_Data_IdentityInput
          customCreatedOn: DateTime
          customVersion: Number
          customLocked: Boolean
        }
        
        input AcoSearchRecordWebinyCreateInput {
          id: ID
          type: String
          title: String
          content: String
          location: AcoSearchRecordWebiny_LocationInput
          data: AcoSearchRecordWebiny_DataInput
          tags: [String!]
        }
        
        input AcoSearchRecordWebinyUpdateInput {
          title: String
          content: String
          location: AcoSearchRecordWebiny_LocationInput
          data: AcoSearchRecordWebiny_DataInput
          tags: [String!]
        }
        
        type AcoSearchRecordWebinyResponse {
          data: AcoSearchRecordWebiny
          error: AcoError
        }
        
        input AcoSearchRecordWebinyListWhereInput {
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
          savedOn: DateTime
          savedOn_gt: DateTime
          savedOn_gte: DateTime
          savedOn_lt: DateTime
          savedOn_lte: DateTime
          savedOn_between: [DateTime!]
          savedOn_not_between: [DateTime!]
          publishedOn: DateTime
          publishedOn_gt: DateTime
          publishedOn_gte: DateTime
          publishedOn_lt: DateTime
          publishedOn_lte: DateTime
          publishedOn_between: [DateTime!]
          publishedOn_not_between: [DateTime!]
          createdBy: String
          createdBy_not: String
          createdBy_in: [String!]
          createdBy_not_in: [String!]
          ownedBy: String
          ownedBy_not: String
          ownedBy_in: [String!]
          ownedBy_not_in: [String!]
          revisionCreatedOn: DateTime
          revisionCreatedOn_gt: DateTime
          revisionCreatedOn_gte: DateTime
          revisionCreatedOn_lt: DateTime
          revisionCreatedOn_lte: DateTime
          revisionCreatedOn_between: [DateTime!]
          revisionCreatedOn_not_between: [DateTime!]
          revisionSavedOn: DateTime
          revisionSavedOn_gt: DateTime
          revisionSavedOn_gte: DateTime
          revisionSavedOn_lt: DateTime
          revisionSavedOn_lte: DateTime
          revisionSavedOn_between: [DateTime!]
          revisionSavedOn_not_between: [DateTime!]
          revisionModifiedOn: DateTime
          revisionModifiedOn_gt: DateTime
          revisionModifiedOn_gte: DateTime
          revisionModifiedOn_lt: DateTime
          revisionModifiedOn_lte: DateTime
          revisionModifiedOn_between: [DateTime!]
          revisionModifiedOn_not_between: [DateTime!]
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
          revisionSavedBy: ID
          revisionSavedBy_not: ID
          revisionSavedBy_in: [ID!]
          revisionSavedBy_not_in: [ID!]
          revisionModifiedBy: ID
          revisionModifiedBy_not: ID
          revisionModifiedBy_in: [ID!]
          revisionModifiedBy_not_in: [ID!]
          revisionFirstPublishedBy: ID
          revisionFirstPublishedBy_not: ID
          revisionFirstPublishedBy_in: [ID!]
          revisionFirstPublishedBy_not_in: [ID!]
          revisionLastPublishedBy: ID
          revisionLastPublishedBy_not: ID
          revisionLastPublishedBy_in: [ID!]
          revisionLastPublishedBy_not_in: [ID!]
          entryCreatedOn: DateTime
          entryCreatedOn_gt: DateTime
          entryCreatedOn_gte: DateTime
          entryCreatedOn_lt: DateTime
          entryCreatedOn_lte: DateTime
          entryCreatedOn_between: [DateTime!]
          entryCreatedOn_not_between: [DateTime!]
          entrySavedOn: DateTime
          entrySavedOn_gt: DateTime
          entrySavedOn_gte: DateTime
          entrySavedOn_lt: DateTime
          entrySavedOn_lte: DateTime
          entrySavedOn_between: [DateTime!]
          entrySavedOn_not_between: [DateTime!]
          entryModifiedOn: DateTime
          entryModifiedOn_gt: DateTime
          entryModifiedOn_gte: DateTime
          entryModifiedOn_lt: DateTime
          entryModifiedOn_lte: DateTime
          entryModifiedOn_between: [DateTime!]
          entryModifiedOn_not_between: [DateTime!]
          entryFirstPublishedOn: DateTime
          entryFirstPublishedOn_gt: DateTime
          entryFirstPublishedOn_gte: DateTime
          entryFirstPublishedOn_lt: DateTime
          entryFirstPublishedOn_lte: DateTime
          entryFirstPublishedOn_between: [DateTime!]
          entryFirstPublishedOn_not_between: [DateTime!]
          entryLastPublishedOn: DateTime
          entryLastPublishedOn_gt: DateTime
          entryLastPublishedOn_gte: DateTime
          entryLastPublishedOn_lt: DateTime
          entryLastPublishedOn_lte: DateTime
          entryLastPublishedOn_between: [DateTime!]
          entryLastPublishedOn_not_between: [DateTime!]
          entryCreatedBy: ID
          entryCreatedBy_not: ID
          entryCreatedBy_in: [ID!]
          entryCreatedBy_not_in: [ID!]
          entrySavedBy: ID
          entrySavedBy_not: ID
          entrySavedBy_in: [ID!]
          entrySavedBy_not_in: [ID!]
          entryModifiedBy: ID
          entryModifiedBy_not: ID
          entryModifiedBy_in: [ID!]
          entryModifiedBy_not_in: [ID!]
          entryFirstPublishedBy: ID
          entryFirstPublishedBy_not: ID
          entryFirstPublishedBy_in: [ID!]
          entryFirstPublishedBy_not_in: [ID!]
          entryLastPublishedBy: ID
          entryLastPublishedBy_not: ID
          entryLastPublishedBy_in: [ID!]
          entryLastPublishedBy_not_in: [ID!]
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
        
          location: AcoSearchRecordWebiny_LocationWhereInput
          data: AcoSearchRecordWebiny_DataWhereInput
        
          tags: String
          tags_not: String
          tags_in: [String]
          tags_not_in: [String]
          tags_contains: String
          tags_not_contains: String
          tags_startsWith: String
          tags_not_startsWith: String
        
          AND: [AcoSearchRecordWebinyListWhereInput!]
          OR: [AcoSearchRecordWebinyListWhereInput!]
        }
        
        type AcoSearchRecordWebinyListResponse {
          data: [AcoSearchRecordWebiny!]
          error: AcoError
          meta: AcoMeta
        }
        
        enum AcoSearchRecordWebinyListSorter {
          id_ASC
          id_DESC
          savedOn_ASC
          savedOn_DESC
          createdOn_ASC
          createdOn_DESC
          revisionCreatedOn_ASC
          revisionCreatedOn_DESC
          revisionSavedOn_ASC
          revisionSavedOn_DESC
          revisionModifiedOn_ASC
          revisionModifiedOn_DESC
          revisionFirstPublishedOn_ASC
          revisionFirstPublishedOn_DESC
          revisionLastPublishedOn_ASC
          revisionLastPublishedOn_DESC
          entryCreatedOn_ASC
          entryCreatedOn_DESC
          entrySavedOn_ASC
          entrySavedOn_DESC
          entryModifiedOn_ASC
          entryModifiedOn_DESC
          entryFirstPublishedOn_ASC
          entryFirstPublishedOn_DESC
          entryLastPublishedOn_ASC
          entryLastPublishedOn_DESC
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
          getAcoSearchRecordWebiny(id: ID!): AcoSearchRecordWebinyResponse!
          listAcoSearchRecordWebiny(
            where: AcoSearchRecordWebinyListWhereInput
            search: String
            limit: Int
            after: String
            sort: [AcoSearchRecordWebinyListSorter!]
          ): AcoSearchRecordWebinyListResponse!
          listAcoSearchRecordWebinyTags(
            where: AcoSearchRecordTagListWhereInput
          ): AcoSearchRecordTagListResponse!
        }
        
        extend type SearchMutation {
          createAcoSearchRecordWebiny(
            data: AcoSearchRecordWebinyCreateInput!
          ): AcoSearchRecordWebinyResponse!
          updateAcoSearchRecordWebiny(
            id: ID!
            data: AcoSearchRecordWebinyUpdateInput!
          ): AcoSearchRecordWebinyResponse!
          moveAcoSearchRecordWebiny(
            id: ID!
            folderId: ID!
          ): AcoSearchRecordMoveResponse!
          deleteAcoSearchRecordWebiny(id: ID!): AcoBooleanResponse!
        }

    `;
};
