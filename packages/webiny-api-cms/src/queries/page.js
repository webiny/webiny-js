// @flow
import { GraphQLNonNull, GraphQLString, GraphQLObjectType } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { Page, Revision } from "./../";
import type { Schema } from "webiny-api/types";

async function formatData(instance: Page | Revision) {
    const page: Page | Revision = (await instance.toJSON(
        "id,slug,title,content[id,type,data]"
    ): any);

    return page;
}

export default (schema: Schema) => {
    schema.addType(
        new GraphQLObjectType({
            name: "CmsPageData",
            description: "Data prepared for rendering on the client",
            fields: {
                id: { type: GraphQLString },
                title: { type: GraphQLString },
                slug: { type: GraphQLString },
                content: { type: GraphQLJSON }
            }
        })
    );

    schema.query["loadPageByUrl"] = {
        type: schema.getType("CmsPageData"),
        args: {
            url: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(root, args) {
            const instance: Page = (await Page.findOne({
                query: { slug: args.url, status: "published" }
            }): any);
            if (!instance) {
                return Promise.reject(new Error("Page not found"));
            }

            return formatData(instance);
        }
    };

    schema.query["loadPageRevision"] = {
        type: schema.getType("CmsPageData"),
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(root, args) {
            const instance: Revision = (await Revision.findById(args.id): any);
            return formatData(instance);
        }
    };
};
