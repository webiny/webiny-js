export default `
    """
    Fruit
    """
    type FruitApiModelValues {
      name: String
      numbers: [Number]
      email: String
      url: String
      lowerCase: String
      upperCase: String
      date: Date
      dateTime: DateTime
      dateTimeZ: DateTimeZ
      time: Time
      isSomething: Boolean
      rating: Number
      description: String
      slug: String
    }
    
    type FruitApiModel {
      id: ID!
      entryId: String!
      modelId: String!
    
      createdOn: DateTime
      modifiedOn: DateTime
      savedOn: DateTime
      deletedOn: DateTime
      restoredOn: DateTime
      firstPublishedOn: DateTime
      lastPublishedOn: DateTime
      createdBy: CmsIdentity
      modifiedBy: CmsIdentity
      savedBy: CmsIdentity
      deletedBy: CmsIdentity
      restoredBy: CmsIdentity
      firstPublishedBy: CmsIdentity
      lastPublishedBy: CmsIdentity
      revisionCreatedOn: DateTime
      revisionModifiedOn: DateTime
      revisionSavedOn: DateTime
      revisionDeletedOn: DateTime
      revisionRestoredOn: DateTime
      revisionFirstPublishedOn: DateTime
      revisionLastPublishedOn: DateTime
      revisionCreatedBy: CmsIdentity
      revisionModifiedBy: CmsIdentity
      revisionSavedBy: CmsIdentity
      revisionDeletedBy: CmsIdentity
      revisionRestoredBy: CmsIdentity
      revisionFirstPublishedBy: CmsIdentity
      revisionLastPublishedBy: CmsIdentity
      values: FruitApiModelValues
    }
    
    input FruitApiModelGetWhereInputValues {
      name: String
      numbers: Number
      email: String
      url: String
      lowerCase: String
      upperCase: String
      date: Date
      dateTime: DateTime
      dateTimeZ: DateTimeZ
      time: Time
      isSomething: Boolean
      rating: Number
      slug: String
    }
    
    input FruitApiModelGetWhereInput {
      id: ID
      entryId: String
      values: FruitApiModelGetWhereInputValues
    }
    
    input FruitApiModelListWhereInputValues {
      name: String
      name_not: String
      name_in: [String]
      name_not_in: [String]
      name_contains: String
      name_not_contains: String
      name_startsWith: String
      name_not_startsWith: String
    
      numbers: Number
      numbers_not: Number
      numbers_in: [Number]
      numbers_not_in: [Number]
      numbers_lt: Number
      numbers_lte: Number
      numbers_gt: Number
      numbers_gte: Number
      # there must be two numbers sent in the array
      numbers_between: [Number!]
      # there must be two numbers sent in the array
      numbers_not_between: [Number!]
    
      email: String
      email_not: String
      email_in: [String]
      email_not_in: [String]
      email_contains: String
      email_not_contains: String
      email_startsWith: String
      email_not_startsWith: String
    
      url: String
      url_not: String
      url_in: [String]
      url_not_in: [String]
      url_contains: String
      url_not_contains: String
      url_startsWith: String
      url_not_startsWith: String
    
      lowerCase: String
      lowerCase_not: String
      lowerCase_in: [String]
      lowerCase_not_in: [String]
      lowerCase_contains: String
      lowerCase_not_contains: String
      lowerCase_startsWith: String
      lowerCase_not_startsWith: String
    
      upperCase: String
      upperCase_not: String
      upperCase_in: [String]
      upperCase_not_in: [String]
      upperCase_contains: String
      upperCase_not_contains: String
      upperCase_startsWith: String
      upperCase_not_startsWith: String
    
      date: Date
      date_not: Date
      date_in: [Date]
      date_not_in: [Date]
      date_lt: Date
      date_lte: Date
      date_gt: Date
      date_gte: Date
    
      dateTime: DateTime
      dateTime_not: DateTime
      dateTime_in: [DateTime]
      dateTime_not_in: [DateTime]
      dateTime_lt: DateTime
      dateTime_lte: DateTime
      dateTime_gt: DateTime
      dateTime_gte: DateTime
    
      dateTimeZ: DateTimeZ
      dateTimeZ_not: DateTimeZ
      dateTimeZ_in: [DateTimeZ]
      dateTimeZ_not_in: [DateTimeZ]
      dateTimeZ_lt: DateTimeZ
      dateTimeZ_lte: DateTimeZ
      dateTimeZ_gt: DateTimeZ
      dateTimeZ_gte: DateTimeZ
    
      time: Time
      time_not: Time
      time_in: [Time]
      time_not_in: [Time]
      time_lt: Time
      time_lte: Time
      time_gt: Time
      time_gte: Time
    
      isSomething: Boolean
      isSomething_not: Boolean
    
      rating: Number
      rating_not: Number
      rating_in: [Number]
      rating_not_in: [Number]
      rating_lt: Number
      rating_lte: Number
      rating_gt: Number
      rating_gte: Number
      # there must be two numbers sent in the array
      rating_between: [Number!]
      # there must be two numbers sent in the array
      rating_not_between: [Number!]
    
      description_contains: String
      description_not_contains: String
    
      slug: String
      slug_not: String
      slug_in: [String]
      slug_not_in: [String]
      slug_contains: String
      slug_not_contains: String
      slug_startsWith: String
      slug_not_startsWith: String
    }
    
    input FruitApiModelListWhereInput {
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
    
      values: FruitApiModelListWhereInputValues
      AND: [FruitApiModelListWhereInput!]
      OR: [FruitApiModelListWhereInput!]
    }
    
    enum FruitApiModelListSorter {
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
      values_name_ASC
      values_name_DESC
      values_numbers_ASC
      values_numbers_DESC
      values_email_ASC
      values_email_DESC
      values_url_ASC
      values_url_DESC
      values_lowerCase_ASC
      values_lowerCase_DESC
      values_upperCase_ASC
      values_upperCase_DESC
      values_date_ASC
      values_date_DESC
      values_dateTime_ASC
      values_dateTime_DESC
      values_dateTimeZ_ASC
      values_dateTimeZ_DESC
      values_time_ASC
      values_time_DESC
      values_isSomething_ASC
      values_isSomething_DESC
      values_rating_ASC
      values_rating_DESC
      values_slug_ASC
      values_slug_DESC
    }
    
    type FruitApiModelResponse {
      data: FruitApiModel
      error: CmsError
    }
    
    type FruitApiModelListResponse {
      data: [FruitApiModel]
      meta: CmsListMeta
      error: CmsError
    }
    
    extend type Query {
      getFruitApiModel(where: FruitApiModelGetWhereInput!): FruitApiModelResponse
    
      listFruitsApiModel(
        where: FruitApiModelListWhereInput
        sort: [FruitApiModelListSorter]
        limit: Int
        after: String
        search: String
      ): FruitApiModelListResponse
    }
`;
