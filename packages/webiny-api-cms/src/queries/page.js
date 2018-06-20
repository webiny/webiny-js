// @flow
import { GraphQLNonNull, GraphQLString, GraphQLObjectType } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { Page, Revision, Widget } from "./../";
import type { Schema } from "webiny-api";

async function formatData(instance: Page | Revision) {
    const page = await instance.toJSON("id,slug,title,content[id,type,data]");

    for (let i = 0; i < page.content.length; i++) {
        if (page.content[i].origin) {
            const { data } = await Widget.findById(page.content[i].origin);
            delete page.content[i].origin;
            Object.assign(page.content[i], { data });
        }
    }
    return page;
}

export default (schema: Schema) => {
    schema.addType({
        type: new GraphQLObjectType({
            name: "CmsPageData",
            description: "Data prepared for rendering on the client",
            fields: {
                id: { type: GraphQLString },
                title: { type: GraphQLString },
                slug: { type: GraphQLString },
                content: { type: GraphQLJSON }
            }
        })
    });

    schema.query["loadPageByUrl"] = {
        type: schema.getType("CmsPageData"),
        args: {
            url: { type: new GraphQLNonNull(GraphQLString) }
        },
        async resolve(root, args) {
            const instance = await Page.findOne({ query: { slug: args.url, status: "published" } });
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
            const instance = await Revision.findById(args.id);
            return formatData(instance);
        }
    };
};
