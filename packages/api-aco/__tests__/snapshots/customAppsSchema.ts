export const createCustomAppsSchemaSnapshot = () => {
    return `
        type AcoSearchRecordCustomWebiny_Location {
          folderId: String
        }
        input AcoSearchRecordCustomWebiny_LocationWhereInput {
          folderId: String
          folderId_not: String
          folderId_in: [String]
          folderId_not_in: [String]
          folderId_contains: String
          folderId_not_contains: String
        }

        type AcoSearchRecordCustomWebiny_Data_CreatedBy {
          id: String
          displayName: String
          type: String
        }
        input AcoSearchRecordCustomWebiny_Data_CreatedByWhereInput {
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

        type AcoSearchRecordCustomWebiny_Data {
          title: String
          createdBy: AcoSearchRecordCustomWebiny_Data_CreatedBy
          createdOn: DateTime
          version: Number
          locked: Boolean
          customWebinyTextField: String
          customWebinyNumberField: Number
        }
        input AcoSearchRecordCustomWebiny_DataWhereInput {
          title: String
          title_not: String
          title_in: [String]
          title_not_in: [String]
          title_contains: String
          title_not_contains: String

          createdBy: AcoSearchRecordCustomWebiny_Data_CreatedByWhereInput

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
          
          customWebinyTextField: String
          customWebinyTextField_not: String
          customWebinyTextField_in: [String]
          customWebinyTextField_not_in: [String]
          customWebinyTextField_contains: String
          customWebinyTextField_not_contains: String
          
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

        type AcoSearchRecordCustomWebinyData {
          type: String
          title: String
          content: String
          location: AcoSearchRecordCustomWebiny_Location
          data: AcoSearchRecordCustomWebiny_Data
          tags: [String]
        }

        type AcoSearchRecordCustomWebiny {
          id: ID!
          type: String!
          location: AcoSearchLocationType!
          title: String!
          content: String
          data: AcoSearchRecordCustomWebinyData!
          tags: [String!]!
          savedOn: DateTime
          createdOn: DateTime
          createdBy: AcoUser
        }

        input AcoSearchRecordCustomWebiny_LocationInput {
          folderId: String!
        }

        input AcoSearchRecordCustomWebiny_Data_CreatedByInput {
          id: String
          displayName: String
          type: String
        }

        input AcoSearchRecordCustomWebiny_DataInput {
          title: String
          createdBy: AcoSearchRecordCustomWebiny_Data_CreatedByInput
          createdOn: DateTime
          version: Number
          locked: Boolean
          customWebinyTextField: String
          customWebinyNumberField: Number
        }

        input AcoSearchRecordCustomWebinyInput {
          id: ID
          type: String!
          title: String!
          content: String
          location: AcoSearchRecordCustomWebiny_LocationInput!
          data: AcoSearchRecordCustomWebiny_DataInput!
          tags: [String!]
        }

        input AcoSearchRecordCustomWebinyListWhereInput {
          type: String!
          location: AcoSearchLocationInput
          tags_in: [String!]
          tags_startsWith: String
          tags_not_startsWith: String
        }

        type AcoSearchRecordCustomWebinyResponse {
          data: AcoSearchRecordCustomWebiny
          error: AcoError
        }

        type AcoSearchRecordCustomWebinyListResponse {
          data: [AcoSearchRecordCustomWebiny!]
          error: AcoError
          meta: AcoMeta
        }

        extend type SearchQuery {
          getAcoSearchRecordCustomWebiny(
            id: ID!
          ): AcoSearchRecordCustomWebinyResponse!
          listAcoSearchRecordCustomWebiny(
            where: AcoSearchRecordCustomWebinyListWhereInput
            search: String
            limit: Int
            after: String
            sort: AcoSort
          ): AcoSearchRecordCustomWebinyListResponse!
        }

        extend type SearchMutation {
          createAcoSearchRecordCustomWebiny(
            data: AcoSearchRecordCustomWebinyInput!
          ): AcoSearchRecordCustomWebinyResponse!
          updateAcoSearchRecordCustomWebiny(
            id: ID!
            data: AcoSearchRecordCustomWebinyInput!
          ): AcoSearchRecordCustomWebinyResponse!
          deleteAcoSearchRecordCustomWebiny(id: ID!): AcoBooleanResponse!
        }
    `;
};
