import { ErrorResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const forms = context?.formBuilder?.crud?.forms;
    const { data } = args;

    try {
        const form = await forms.create(data);
        // Index form in "Elastic Search"
        await context.elasticSearch.create({
            id: form.id,
            index: "form-builder",
            type: "_doc",
            body: {
                id: form.id,
                createdOn: form.createdOn,
                savedOn: form.savedOn,
                name: form.name,
                slug: form.slug,
                published: form.published,
                publishedOn: form.publishedOn,
                version: form.version,
                locked: form.locked,
                latestVersion: form.latestVersion,
                status: form.status,
                createdBy: form.createdBy
            }
        });

        return new Response(form);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
