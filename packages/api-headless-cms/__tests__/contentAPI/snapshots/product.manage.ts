import { metaDataComment, revisionsComment } from "./snippets";

export default /* GraphQL */ `
    """
    Products being sold in our webshop
    """
    type ProductApiSingular {
        id: ID!
        entryId: String!
        createdOn: DateTime!
        savedOn: DateTime!
        createdBy: CmsIdentity!
        ownedBy: CmsIdentity!
        modifiedBy: CmsIdentity
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
    }

    type ProductApiSingularMeta {
        modelId: String
        version: Int
        locked: Boolean
        publishedOn: DateTime
        status: String
        ${revisionsComment}
        revisions: [ProductApiSingular!]
        title: String
        description: String
        image: String
        ${metaDataComment}
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
    }
    
    input ProductApiSingular_Variant_OptionsInput {
        name: String
        price: Number
        image: String
        category: RefFieldInput!
        categories: [RefFieldInput]
        longText: [String]
    }
    
    input ProductApiSingular_VariantInput {
        name: String
        price: Number
        images: [String]
        category: RefFieldInput!
        options: [ProductApiSingular_Variant_OptionsInput!]
    }

    input ProductApiSingular_FieldsObjectInput {
        text: String!
    }


    input ProductApiSingularInput {
        id: ID
        title: String!
        category: RefFieldInput!
        price: Number!
        inStock: Boolean
        itemsInStock: Number
        availableOn: Date
        color: String!
        availableSizes: [String!]
        image: String!
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

        title: String
        title_not: String
        title_in: [String]
        title_not_in: [String]
        title_contains: String
        title_not_contains: String
        
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
        
        
        availableSizes: String
        availableSizes_not: String
        availableSizes_in: [String]
        availableSizes_not_in: [String]
        availableSizes_contains: String
        availableSizes_not_contains: String
        
        variant: ProductApiSingular_VariantWhereInput
        fieldsObject: ProductApiSingular_FieldsObjectWhereInput
        AND: [ProductApiSingularListWhereInput!]
        OR: [ProductApiSingularListWhereInput!]
    }

    type ProductApiSingularResponse {
        data: ProductApiSingular
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
        getProductApiSingular(revision: ID, entryId: ID, status: CmsEntryStatusType): ProductApiSingularResponse
        
        getProductApiSingularRevisions(id: ID!): ProductApiSingularArrayResponse
        
        getProductPluralApiNameByIds(revisions: [ID!]!): ProductApiSingularArrayResponse

        listProductPluralApiName(
            where: ProductApiSingularListWhereInput
            sort: [ProductApiSingularListSorter]
            limit: Int
            after: String
        ): ProductApiSingularListResponse
    }

    extend type Mutation {
        createProductApiSingular(data: ProductApiSingularInput!): ProductApiSingularResponse

        createProductApiSingularFrom(revision: ID!, data: ProductApiSingularInput): ProductApiSingularResponse

        updateProductApiSingular(revision: ID!, data: ProductApiSingularInput!): ProductApiSingularResponse

        deleteProductApiSingular(revision: ID!): CmsDeleteResponse

        deleteMultipleProductPluralApiName(entries: [ID!]!): CmsDeleteMultipleResponse!

        publishProductApiSingular(revision: ID!): ProductApiSingularResponse
    
        republishProductApiSingular(revision: ID!): ProductApiSingularResponse

        unpublishProductApiSingular(revision: ID!): ProductApiSingularResponse
    }
`;
