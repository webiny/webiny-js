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
          savedOn: DateTime!
          createdOn: DateTime!
          createdBy: AcoUser!
          type: String
          title: String
          content: String
          location: AcoSearchRecordWebiny_Location
          data: AcoSearchRecordWebiny_Data
          tags: [String]
        }

        input AcoSearchRecordWebiny_LocationInput {
          folderId: String!
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
          type: String!
          title: String!
          content: String
          location: AcoSearchRecordWebiny_LocationInput!
          data: AcoSearchRecordWebiny_DataInput!
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
          createdBy: String
          createdBy_not: String
          createdBy_in: [String!]
          createdBy_not_in: [String!]
          ownedBy: String
          ownedBy_not: String
          ownedBy_in: [String!]
          ownedBy_not_in: [String!]
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
          getAcoSearchRecordWebiny(
            id: ID!
          ): AcoSearchRecordWebinyResponse!
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
          deleteAcoSearchRecordWebiny(id: ID!): AcoBooleanResponse!
        }
    `;
};
