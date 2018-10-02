// @flow
import { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLBoolean, GraphQLList } from "graphql";
import { GraphQLDateTime } from "graphql-iso-date";
import GraphQLJSON from "graphql-type-json";
import Revision from "./Revision.entity";
import { PageType } from "../Page/Page.graphql";
import { crudFields, createField, schema } from "webiny-api/graphql";

export const RevisionType = new GraphQLObjectType({
    name: Revision.classId,
    fields: () => ({
        id: { type: GraphQLID },
        createdOn: { type: GraphQLDateTime },
        name: { type: GraphQLString, description: "Revision name" },
        title: { type: GraphQLString, description: "Page title" },
        slug: { type: GraphQLString },
        settings: { type: GraphQLJSON },
        content: { type: GraphQLJSON },
        published: { type: GraphQLBoolean},
        locked: { type: GraphQLBoolean},
        page: { type: schema.getType(PageType.name) }
    })
});

export const RevisionQueryType = new GraphQLObjectType({
    name: "CmsRevisions",
    fields: () => crudFields(Revision, schema.getType(RevisionType.name))
});

export const createRevisionQueryField = () => createField(schema.getType(RevisionQueryType.name));
