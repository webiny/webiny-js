export default /* GraphQL */ `
    type FmFile_Location {
        folderId: String
    }

    input FmFile_LocationWhereInput {
        folderId: String
        folderId_not: String
        folderId_in: [String]
        folderId_not_in: [String]
        folderId_contains: String
        folderId_not_contains: String
        folderId_startsWith: String
        folderId_not_startsWith: String
    }

    type FmFile_Meta {
        private: Boolean
        width: Number
        height: Number
    }

    input FmFile_MetaWhereInput {
        private: Boolean
        private_not: Boolean

        width: Number
        width_not: Number
        width_in: [Number]
        width_not_in: [Number]
        width_lt: Number
        width_lte: Number
        width_gt: Number
        width_gte: Number
        # there must be two numbers sent in the array
        width_between: [Number!]
        # there must be two numbers sent in the array
        width_not_between: [Number!]

        height: Number
        height_not: Number
        height_in: [Number]
        height_not_in: [Number]
        height_lt: Number
        height_lte: Number
        height_gt: Number
        height_gte: Number
        # there must be two numbers sent in the array
        height_between: [Number!]
        # there must be two numbers sent in the array
        height_not_between: [Number!]
    }

    type FmFile_Extensions {
        carMake: String
        year: Number
    }

    input FmFile_ExtensionsWhereInput {
        carMake: String
        carMake_not: String
        carMake_in: [String]
        carMake_not_in: [String]
        carMake_contains: String
        carMake_not_contains: String
        carMake_startsWith: String
        carMake_not_startsWith: String

        year: Number
        year_not: Number
        year_in: [Number]
        year_not_in: [Number]
        year_lt: Number
        year_lte: Number
        year_gt: Number
        year_gte: Number
        # there must be two numbers sent in the array
        year_between: [Number!]
        # there must be two numbers sent in the array
        year_not_between: [Number!]
    }

    type FmFile {
        id: ID!
        savedOn: DateTime!
        createdOn: DateTime!
        createdBy: FmCreatedBy!
        src: String
        location: FmFile_Location
        name: String
        key: String
        type: String
        size: Number
        meta: FmFile_Meta
        tags: [String]
        aliases: [String]
        extensions: FmFile_Extensions
    }

    input FmFile_LocationInput {
        folderId: String
    }

    input FmFile_MetaInput {
        private: Boolean
        width: Number
        height: Number
    }

    input FmFile_ExtensionsInput {
        carMake: String
        year: Number
    }

    input FmFileCreateInput {
        id: ID!
        location: FmFile_LocationInput
        name: String!
        key: String!
        type: String!
        size: Number!
        meta: FmFile_MetaInput
        tags: [String!]
        aliases: [String!]
        extensions: FmFile_ExtensionsInput
    }

    input FmFileUpdateInput {
        location: FmFile_LocationInput
        name: String
        key: String
        type: String
        size: Number
        meta: FmFile_MetaInput
        tags: [String]
        aliases: [String]
        extensions: FmFile_ExtensionsInput
    }

    type FmFileResponse {
        data: FmFile
        error: FmError
    }

    input FmFileListWhereInput {
        id: ID
        id_not: ID
        id_in: [ID!]
        id_not_in: [ID!]
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
        location: FmFile_LocationWhereInput

        name: String
        name_not: String
        name_in: [String]
        name_not_in: [String]
        name_contains: String
        name_not_contains: String
        name_startsWith: String
        name_not_startsWith: String

        key: String
        key_not: String
        key_in: [String]
        key_not_in: [String]
        key_contains: String
        key_not_contains: String
        key_startsWith: String
        key_not_startsWith: String

        type: String
        type_not: String
        type_in: [String]
        type_not_in: [String]
        type_contains: String
        type_not_contains: String
        type_startsWith: String
        type_not_startsWith: String

        size: Number
        size_not: Number
        size_in: [Number]
        size_not_in: [Number]
        size_lt: Number
        size_lte: Number
        size_gt: Number
        size_gte: Number
        # there must be two numbers sent in the array
        size_between: [Number!]
        # there must be two numbers sent in the array
        size_not_between: [Number!]

        meta: FmFile_MetaWhereInput

        tags: String
        tags_not: String
        tags_in: [String]
        tags_not_in: [String]
        tags_contains: String
        tags_not_contains: String
        tags_startsWith: String
        tags_not_startsWith: String

        aliases: String
        aliases_not: String
        aliases_in: [String]
        aliases_not_in: [String]
        aliases_contains: String
        aliases_not_contains: String
        aliases_startsWith: String
        aliases_not_startsWith: String

        extensions: FmFile_ExtensionsWhereInput
        AND: [FmFileListWhereInput!]
        OR: [FmFileListWhereInput!]
    }

    type FmFileListResponse {
        data: [FmFile!]
        error: FmError
        meta: FmListMeta
    }

    enum FmFileListSorter {
        id_ASC
        id_DESC
        savedOn_ASC
        savedOn_DESC
        createdOn_ASC
        createdOn_DESC
        name_ASC
        name_DESC
        key_ASC
        key_DESC
        type_ASC
        type_DESC
        size_ASC
        size_DESC
    }

    input FmTagsListWhereInput {
        createdBy: String
        tags_startsWith: String
        tags_not_startsWith: String
    }

    type FmTag {
        tag: String!
        count: Number!
    }

    type FmTagsListResponse {
        data: [FmTag!]
        error: FmError
    }

    type FmCreateFilesResponse {
        data: [FmFile!]
        error: FmError
    }

    type FmFileModelResponse {
        data: JSON
        error: FmError
    }

    extend type FmQuery {
        getFileModel: FmFileModelResponse!
        getFile(id: ID!): FmFileResponse!
        listFiles(
            search: String
            where: FmFileListWhereInput
            limit: Int
            after: String
            sort: [FmFileListSorter!]
        ): FmFileListResponse!
        listTags(where: FmTagsListWhereInput): FmTagsListResponse!
    }

    extend type FmMutation {
        createFile(data: FmFileCreateInput!): FmFileResponse!
        createFiles(data: [FmFileCreateInput!]!): FmCreateFilesResponse!
        updateFile(id: ID!, data: FmFileUpdateInput!): FmFileResponse!
        deleteFile(id: ID!): FmBooleanResponse!
    }
`;
