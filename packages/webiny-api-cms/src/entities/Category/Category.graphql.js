// @flow
import { GraphQLObjectType, GraphQLString, GraphQLID } from "graphql";
import { GraphQLDateTime } from "graphql-iso-date";
import Category from "./Category.entity";
import { crudFields, createField, schema } from "webiny-api/graphql";

export const CategoryType = new GraphQLObjectType({
    name: Category.classId,
    fields: () => ({
        id: { type: GraphQLID },
        createdOn: { type: GraphQLDateTime },
        name: { type: GraphQLString },
        slug: { type: GraphQLString },
        url: { type: GraphQLString },
        layout: { type: GraphQLString }
    })
});

export const CategoryQueryType = new GraphQLObjectType({
    name: "CmsCategories",
    fields: () => crudFields(Category, schema.getType(CategoryType.name))
});

export const createCategoryQueryField = () => createField(schema.getType(CategoryQueryType.name));
