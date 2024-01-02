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
        originalKey: String
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

        originalKey: String
        originalKey_not: String
        originalKey_in: [String]
        originalKey_not_in: [String]
        originalKey_contains: String
        originalKey_not_contains: String
        originalKey_startsWith: String
        originalKey_not_startsWith: String
    }

    type FmFile_Extensions {
        carMake: String
        year: Number
        article: RefField
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

        article: RefFieldWhereInput
    }

    type FmFile {
        id: ID!
        createdOn: DateTime!
        modifiedOn: DateTime
        savedOn: DateTime!
        createdBy: FmCreatedBy!
        modifiedBy: FmCreatedBy
        savedBy: FmCreatedBy!
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
        originalKey: String
    }

    input FmFile_ExtensionsInput {
        carMake: String
        year: Number
        article: RefFieldInput
    }

    input FmCreatedByInput {
        id: ID!
        displayName: String!
        type: String!
    }

    input FmFileCreateInput {
        id: ID!
        createdOn: DateTime
        modifiedOn: DateTime
        savedOn: DateTime
        createdBy: FmCreatedByInput
        modifiedBy: FmCreatedByInput
        savedBy: FmCreatedByInput
        location: FmFile_LocationInput
        name: String
        key: String
        type: String
        size: Number
        meta: FmFile_MetaInput
        tags: [String!]
        aliases: [String!]
        extensions: FmFile_ExtensionsInput
    }

    input FmFileUpdateInput {
        createdOn: DateTime
        modifiedOn: DateTime
        savedOn: DateTime
        createdBy: FmCreatedByInput
        modifiedBy: FmCreatedByInput
        savedBy: FmCreatedByInput
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
