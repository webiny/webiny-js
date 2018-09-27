// @flow
import { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList } from "graphql";
import { GraphQLDateTime } from "graphql-iso-date";
import GraphQLJSON from "graphql-type-json";
import Page from "./Page.entity";
import { CategoryType } from "../Category/Category.graphql";
import { RevisionType } from "../Revision/Revision.graphql";
import { crudFields, createField, schema } from "webiny-api/graphql";

export const PageType = new GraphQLObjectType({
    name: Page.classId,
    fields: () => ({
        id: { type: GraphQLID },
        createdOn: { type: GraphQLDateTime },
        title: { type: GraphQLString },
        slug: { type: GraphQLString },
        settings: { type: GraphQLJSON },
        content: { type: GraphQLJSON },
        category: { type: schema.getType(CategoryType.name) },
        status: { type: GraphQLString },
        activeRevision: { type: schema.getType(RevisionType.name) },
        revisions: { type: new GraphQLList(schema.getType(RevisionType.name)) },
    })
});

export const PageQueryType = new GraphQLObjectType({
    name: "CmsPages",
    fields: () => crudFields(Page, schema.getType(PageType.name))
});

export const createPageQueryField = () => createField(schema.getType(PageQueryType.name));
