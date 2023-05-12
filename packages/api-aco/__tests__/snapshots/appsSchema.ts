export const createAppsSchemaSnapshot = () => {
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
        }

        type AcoSearchRecordWebiny_Data_CreatedBy {
          id: String
          displayName: String
          type: String
        }
        input AcoSearchRecordWebiny_Data_CreatedByWhereInput {
          id: String
          id_not: String
          id_in: [String]
          id_not_in: [String]
          id_contains: String
          id_not_contains: String

          displayName: String
          displayName_not: String
          displayName_in: [String]
          displayName_not_in: [String]
          displayName_contains: String
          displayName_not_contains: String

          type: String
          type_not: String
          type_in: [String]
          type_not_in: [String]
          type_contains: String
          type_not_contains: String
        }

        type AcoSearchRecordWebiny_Data {
          title: String
          createdBy: AcoSearchRecordWebiny_Data_CreatedBy
          createdOn: DateTime
          version: Number
          locked: Boolean
        }
        input AcoSearchRecordWebiny_DataWhereInput {
          title: String
          title_not: String
          title_in: [String]
          title_not_in: [String]
          title_contains: String
          title_not_contains: String

          createdBy: AcoSearchRecordWebiny_Data_CreatedByWhereInput

          createdOn: DateTime
          createdOn_not: DateTime
          createdOn_in: [DateTime]
          createdOn_not_in: [DateTime]
          createdOn_lt: DateTime
          createdOn_lte: DateTime
          createdOn_gt: DateTime
          createdOn_gte: DateTime

          version: Number
          version_not: Number
          version_in: [Number]
          version_not_in: [Number]
          version_lt: Number
          version_lte: Number
          version_gt: Number
          version_gte: Number
          # there must be two numbers sent in the array
          version_between: [Number!]
          # there must be two numbers sent in the array
          version_not_between: [Number!]

          locked: Boolean
          locked_not: Boolean
        }

        type AcoSearchRecordWebinyData {
          type: String
          title: String
          content: String
          location: AcoSearchRecordWebiny_Location
          data: AcoSearchRecordWebiny_Data
          tags: [String]
        }

        type AcoSearchRecordWebiny {
          id: ID!
          type: String!
          location: AcoSearchLocationType!
          title: String!
          content: String
          data: AcoSearchRecordWebinyData!
          tags: [String!]!
          savedOn: DateTime
          createdOn: DateTime
          createdBy: AcoUser
        }

        input AcoSearchRecordWebiny_LocationInput {
          folderId: String!
        }

        input AcoSearchRecordWebiny_Data_CreatedByInput {
          id: String
          displayName: String
          type: String
        }

        input AcoSearchRecordWebiny_DataInput {
          title: String
          createdBy: AcoSearchRecordWebiny_Data_CreatedByInput
          createdOn: DateTime
          version: Number
          locked: Boolean
        }

        input AcoSearchRecordWebinyDataInput {
          type: String!
          title: String
          content: String
          location: AcoSearchRecordWebiny_LocationInput
          data: AcoSearchRecordWebiny_DataInput
          tags: [String]
        }

        input AcoSearchRecordWebinyInput {
          id: ID
          type: String!
          title: String
          content: String
          location: AcoSearchRecordWebiny_LocationInput
          data: AcoSearchRecordWebiny_DataInput
          tags: [String]
        }

        input AcoSearchRecordWebinyListWhereInput {
          type: String!
          location: AcoSearchLocationInput
          tags_in: [String!]
          tags_startsWith: String
          tags_not_startsWith: String
        }

        type AcoSearchRecordWebinyResponse {
          data: AcoSearchRecordWebiny
          error: AcoError
        }

        type AcoSearchRecordWebinyListResponse {
          data: [AcoSearchRecordWebiny!]
          error: AcoError
          meta: AcoMeta
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
            sort: AcoSort
          ): AcoSearchRecordWebinyListResponse!
        }

        extend type SearchMutation {
          createAcoSearchRecordWebiny(
            data: AcoSearchRecordWebinyInput!
          ): AcoSearchRecordWebinyResponse!
          updateAcoSearchRecordWebiny(
            id: ID!
            data: AcoSearchRecordWebinyInput!
          ): AcoSearchRecordWebinyResponse!
          deleteAcoSearchRecordWebiny(id: ID!): AcoBooleanResponse!
        }
    `;
};
