export default /* GraphQL */ `
    """
    Products being sold in our webshop
    """
    type ProductApiSingular {
        id: ID!
        entryId: String!

        createdOn: DateTime!
        @deprecated(reason: "Use 'revisionCreatedOn' or 'entryCreatedOn''.")
        savedOn: DateTime!
        @deprecated(reason: "Use 'revisionSavedOn' or 'entrySavedOn'.")
        createdBy: CmsIdentity!
        @deprecated(reason: "Use 'revisionCreatedBy' or 'entryCreatedBy'.")
        ownedBy: CmsIdentity! @deprecated(reason: "Use 'entryCreatedBy.")
        modifiedBy: CmsIdentity
        @deprecated(reason: "Use 'revisionModifiedBy' or 'entryModifiedBy'.")
        revisionCreatedOn: DateTime!
        revisionSavedOn: DateTime!
        revisionModifiedOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentity!
        revisionSavedBy: CmsIdentity!
        revisionModifiedBy: CmsIdentity
        revisionFirstPublishedBy: CmsIdentity
        revisionLastPublishedBy: CmsIdentity
        entryCreatedOn: DateTime!
        entrySavedOn: DateTime!
        entryModifiedOn: DateTime
        entryFirstPublishedOn: DateTime
        entryLastPublishedOn: DateTime
        entryCreatedBy: CmsIdentity!
        entrySavedBy: CmsIdentity!
        entryModifiedBy: CmsIdentity
        entryFirstPublishedBy: CmsIdentity
        entryLastPublishedBy: CmsIdentity

        meta: ProductApiSingularMeta
        title: String
        category: RefField
        price: Number
        inStock: Boolean
        itemsInStock: Number
        availableOn: Date
        color: String
        availableSizes: [String]
        image: String
        richText: JSON
        variant: ProductApiSingular_Variant
        fieldsObject: ProductApiSingular_FieldsObject
        # Advanced Content Organization - make required in 5.38.0
        wbyAco_location: WbyAcoLocation
    }

    type ProductApiSingularMeta {
        modelId: String
        version: Int
        locked: Boolean
        publishedOn: DateTime

        status: String
        """
        CAUTION: this field is resolved by making an extra query to DB.
        RECOMMENDATION: Use it only with "get" queries (avoid in "list")
        """
        revisions: [ProductApiSingular!]
        title: String
        description: String
        image: String
        """
        Custom meta data stored in the root of the entry object.
        """
        data: JSON
    }

    type ProductApiSingular_Variant_Options {
        name: String
        price: Number
        image: String
        category: RefField
        categories: [RefField!]
        longText: [String]
    }

    input ProductApiSingular_Variant_OptionsWhereInput {
        name: String
        name_not: String
        name_in: [String]
        name_not_in: [String]
        name_contains: String
        name_not_contains: String
        name_startsWith: String
        name_not_startsWith: String

        price: Number
        price_not: Number
        price_in: [Number]
        price_not_in: [Number]
        price_lt: Number
        price_lte: Number
        price_gt: Number
        price_gte: Number
        # there must be two numbers sent in the array
        price_between: [Number!]
        # there must be two numbers sent in the array
        price_not_between: [Number!]

        category: RefFieldWhereInput

        categories: RefFieldWhereInput

        longText_contains: String
        longText_not_contains: String
    }

    type ProductApiSingular_Variant {
        name: String
        price: Number
        images: [String]
        category: RefField
        options: [ProductApiSingular_Variant_Options!]
    }

    input ProductApiSingular_VariantWhereInput {
        name: String
        name_not: String
        name_in: [String]
        name_not_in: [String]
        name_contains: String
        name_not_contains: String
        name_startsWith: String
        name_not_startsWith: String

        price: Number
        price_not: Number
        price_in: [Number]
        price_not_in: [Number]
        price_lt: Number
        price_lte: Number
        price_gt: Number
        price_gte: Number
        # there must be two numbers sent in the array
        price_between: [Number!]
        # there must be two numbers sent in the array
        price_not_between: [Number!]

        category: RefFieldWhereInput

        options: ProductApiSingular_Variant_OptionsWhereInput
    }

    type ProductApiSingular_FieldsObject {
        text: String
    }

    input ProductApiSingular_FieldsObjectWhereInput {
        text: String
        text_not: String
        text_in: [String]
        text_not_in: [String]
        text_contains: String
        text_not_contains: String
        text_startsWith: String
        text_not_startsWith: String
    }

    input ProductApiSingular_Variant_OptionsInput {
        name: String
        price: Number
        image: String
        category: RefFieldInput
        categories: [RefFieldInput]
        longText: [String]
    }

    input ProductApiSingular_VariantInput {
        name: String
        price: Number
        images: [String]
        category: RefFieldInput
        options: [ProductApiSingular_Variant_OptionsInput!]
    }

    input ProductApiSingular_FieldsObjectInput {
        text: String
    }

    input ProductApiSingularInput {
        id: ID

        # Set status of the entry.
        status: String

        # Set a different date/time as the creation date/time of the entry.
        createdOn: DateTime
        @deprecated(reason: "Use 'revisionCreatedOn' or 'entryCreatedOn'.")

        # Set a different date/time as the last modification date/time of the entry.
        savedOn: DateTime
        @deprecated(reason: "Use 'revisionSavedOn' or 'entrySavedOn'.")

        # Set a different date/time as the publication date/time of the entry.
        publishedOn: DateTime
        @deprecated(reason: "Use 'revisionPublishedOn' or 'entryPublishedOn'.")

        # Set a different identity as the creator of the entry.
        createdBy: CmsIdentityInput
        @deprecated(reason: "Use 'revisionCreatedBy' or 'entryCreatedBy'.")

        # Set a different identity as the last editor of the entry.
        modifiedBy: CmsIdentityInput
        @deprecated(reason: "Use 'revisionModifiedBy' or 'entryModifiedBy'.")

        # Set a different identity as the owner of the entry.
        ownedBy: CmsIdentityInput
        @deprecated(reason: "Use 'revisionOwnedBy' or 'entryOwnedBy'.")

        revisionCreatedOn: DateTime
        revisionSavedOn: DateTime
        revisionModifiedOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentityInput
        revisionSavedBy: CmsIdentityInput
        revisionModifiedBy: CmsIdentityInput
        revisionFirstPublishedBy: CmsIdentityInput
        revisionLastPublishedBy: CmsIdentityInput
        entryCreatedOn: DateTime
        entrySavedOn: DateTime
        entryModifiedOn: DateTime
        entryFirstPublishedOn: DateTime
        entryLastPublishedOn: DateTime
        entryCreatedBy: CmsIdentityInput
        entrySavedBy: CmsIdentityInput
        entryModifiedBy: CmsIdentityInput
        entryFirstPublishedBy: CmsIdentityInput
        entryLastPublishedBy: CmsIdentityInput

        wbyAco_location: WbyAcoLocationInput

        title: String
        category: RefFieldInput
        price: Number
        inStock: Boolean
        itemsInStock: Number
        availableOn: Date
        color: String
        availableSizes: [String!]
        image: String
        richText: JSON
        variant: ProductApiSingular_VariantInput
        fieldsObject: ProductApiSingular_FieldsObjectInput
    }

    input ProductApiSingularGetWhereInput {
        id: ID
        entryId: String
        title: String
        price: Number
        inStock: Boolean
        itemsInStock: Number
        availableOn: Date
        color: String
        availableSizes: String
    }

    input ProductApiSingularListWhereInput {
        wbyAco_location: WbyAcoLocationWhereInput
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

        title: String
        title_not: String
        title_in: [String]
        title_not_in: [String]
        title_contains: String
        title_not_contains: String
        title_startsWith: String
        title_not_startsWith: String

        category: RefFieldWhereInput

        price: Number
        price_not: Number
        price_in: [Number]
        price_not_in: [Number]
        price_lt: Number
        price_lte: Number
        price_gt: Number
        price_gte: Number
        # there must be two numbers sent in the array
        price_between: [Number!]
        # there must be two numbers sent in the array
        price_not_between: [Number!]

        inStock: Boolean
        inStock_not: Boolean

        itemsInStock: Number
        itemsInStock_not: Number
        itemsInStock_in: [Number]
        itemsInStock_not_in: [Number]
        itemsInStock_lt: Number
        itemsInStock_lte: Number
        itemsInStock_gt: Number
        itemsInStock_gte: Number
        # there must be two numbers sent in the array
        itemsInStock_between: [Number!]
        # there must be two numbers sent in the array
        itemsInStock_not_between: [Number!]

        availableOn: Date
        availableOn_not: Date
        availableOn_in: [Date]
        availableOn_not_in: [Date]
        availableOn_lt: Date
        availableOn_lte: Date
        availableOn_gt: Date
        availableOn_gte: Date

        color: String
        color_not: String
        color_in: [String]
        color_not_in: [String]
        color_contains: String
        color_not_contains: String
        color_startsWith: String
        color_not_startsWith: String

        availableSizes: String
        availableSizes_not: String
        availableSizes_in: [String]
        availableSizes_not_in: [String]
        availableSizes_contains: String
        availableSizes_not_contains: String
        availableSizes_startsWith: String
        availableSizes_not_startsWith: String

        variant: ProductApiSingular_VariantWhereInput
        fieldsObject: ProductApiSingular_FieldsObjectWhereInput
        AND: [ProductApiSingularListWhereInput!]
        OR: [ProductApiSingularListWhereInput!]
    }

    type ProductApiSingularResponse {
        data: ProductApiSingular
        error: CmsError
    }

    type ProductApiSingularMoveResponse {
        data: Boolean
        error: CmsError
    }

    type ProductApiSingularArrayResponse {
        data: [ProductApiSingular]
        error: CmsError
    }

    type ProductApiSingularListResponse {
        data: [ProductApiSingular]
        meta: CmsListMeta
        error: CmsError
    }

    enum ProductApiSingularListSorter {
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
        title_ASC
        title_DESC
        price_ASC
        price_DESC
        inStock_ASC
        inStock_DESC
        itemsInStock_ASC
        itemsInStock_DESC
        availableOn_ASC
        availableOn_DESC
        color_ASC
        color_DESC
        availableSizes_ASC
        availableSizes_DESC
    }

    extend type Query {
        getProductApiSingular(
            revision: ID
            entryId: ID
            status: CmsEntryStatusType
        ): ProductApiSingularResponse

        getProductApiSingularRevisions(id: ID!): ProductApiSingularArrayResponse

        getProductPluralApiNameByIds(
            revisions: [ID!]!
        ): ProductApiSingularArrayResponse

        listProductPluralApiName(
            where: ProductApiSingularListWhereInput
            sort: [ProductApiSingularListSorter]
            limit: Int
            after: String
            search: String
        ): ProductApiSingularListResponse
    }

    extend type Mutation {
        createProductApiSingular(
            data: ProductApiSingularInput!
            options: CreateCmsEntryOptionsInput
        ): ProductApiSingularResponse

        createProductApiSingularFrom(
            revision: ID!
            data: ProductApiSingularInput
            options: CreateRevisionCmsEntryOptionsInput
        ): ProductApiSingularResponse

        updateProductApiSingular(
            revision: ID!
            data: ProductApiSingularInput!
            options: UpdateCmsEntryOptionsInput
        ): ProductApiSingularResponse

        validateProductApiSingular(
            revision: ID
            data: ProductApiSingularInput!
        ): CmsEntryValidationResponse!

        moveProductApiSingular(
            revision: ID!
            folderId: ID!
        ): ProductApiSingularMoveResponse

        deleteProductApiSingular(
            revision: ID!
            options: CmsDeleteEntryOptions
        ): CmsDeleteResponse

        deleteMultipleProductPluralApiName(
            entries: [ID!]!
        ): CmsDeleteMultipleResponse!

        publishProductApiSingular(
            revision: ID!
            options: CmsPublishEntryOptionsInput
        ): ProductApiSingularResponse

        republishProductApiSingular(revision: ID!): ProductApiSingularResponse

        unpublishProductApiSingular(revision: ID!): ProductApiSingularResponse
    }

`;
