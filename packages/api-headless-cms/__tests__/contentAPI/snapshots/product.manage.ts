export default /* GraphQL */ `
    """
    Products being sold in our webshop
    """
    type ProductApiSingular {
        id: ID!
        entryId: String!

        createdOn: DateTime!
        modifiedOn: DateTime
        savedOn: DateTime!
        deletedOn: DateTime
        firstPublishedOn: DateTime
        lastPublishedOn: DateTime
        createdBy: CmsIdentity!
        modifiedBy: CmsIdentity
        savedBy: CmsIdentity!
        deletedBy: CmsIdentity
        firstPublishedBy: CmsIdentity
        lastPublishedBy: CmsIdentity
        revisionCreatedOn: DateTime!
        revisionModifiedOn: DateTime
        revisionSavedOn: DateTime!
        revisionDeletedOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentity!
        revisionModifiedBy: CmsIdentity
        revisionSavedBy: CmsIdentity!
        revisionDeletedBy: CmsIdentity
        revisionFirstPublishedBy: CmsIdentity
        revisionLastPublishedBy: CmsIdentity

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

        createdOn: DateTime
        modifiedOn: DateTime
        savedOn: DateTime
        deletedOn: DateTime
        firstPublishedOn: DateTime
        lastPublishedOn: DateTime
        createdBy: CmsIdentityInput
        modifiedBy: CmsIdentityInput
        savedBy: CmsIdentityInput
        deletedBy: CmsIdentityInput
        firstPublishedBy: CmsIdentityInput
        lastPublishedBy: CmsIdentityInput
        revisionCreatedOn: DateTime
        revisionModifiedOn: DateTime
        revisionSavedOn: DateTime
        revisionDeletedOn: DateTime
        revisionFirstPublishedOn: DateTime
        revisionLastPublishedOn: DateTime
        revisionCreatedBy: CmsIdentityInput
        revisionModifiedBy: CmsIdentityInput
        revisionSavedBy: CmsIdentityInput
        revisionDeletedBy: CmsIdentityInput
        revisionFirstPublishedBy: CmsIdentityInput
        revisionLastPublishedBy: CmsIdentityInput

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
        createdOn_ASC
        createdOn_DESC
        modifiedOn_ASC
        modifiedOn_DESC
        savedOn_ASC
        savedOn_DESC
        deletedOn_ASC
        deletedOn_DESC
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
        revisionFirstPublishedOn_ASC
        revisionFirstPublishedOn_DESC
        revisionLastPublishedOn_ASC
        revisionLastPublishedOn_DESC
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

        getProductPluralApiNameByIds(revisions: [ID!]!): ProductApiSingularArrayResponse

        listProductPluralApiName(
            where: ProductApiSingularListWhereInput
            sort: [ProductApiSingularListSorter]
            limit: Int
            after: String
            search: String
        ): ProductApiSingularListResponse

        listDeletedProductPluralApiName(
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

        moveProductApiSingular(revision: ID!, folderId: ID!): ProductApiSingularMoveResponse

        deleteProductApiSingular(revision: ID!, options: CmsDeleteEntryOptions): CmsDeleteResponse

        deleteMultipleProductPluralApiName(entries: [ID!]!): CmsDeleteMultipleResponse!

        publishProductApiSingular(revision: ID!): ProductApiSingularResponse

        republishProductApiSingular(revision: ID!): ProductApiSingularResponse

        unpublishProductApiSingular(revision: ID!): ProductApiSingularResponse
    }
`;
