import { ErrorResponse, Response, NotFoundResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const { i18nContent, formBuilder } = context;
        const forms = formBuilder?.crud?.forms;

        const sourceRev = await forms.get(args.revision);
        if (!sourceRev) {
            return new NotFoundResponse(`Revision with id "${args.revision}" was not found!`);
        }

        const form = await forms.create({
            id: sourceRev.id,
            name: sourceRev.name,
            slug: sourceRev.slug,
            settings: sourceRev.settings,
            layout: sourceRev.layout,
            fields: sourceRev.fields,
            triggers: sourceRev.triggers,
            parent: sourceRev.parent
        });

        // Index form in "Elastic Search"
        await context.elasticSearch.create({
            id: form.id,
            index: "form-builder",
            type: "_doc",
            body: {
                id: form.id,
                parent: form.parent,
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
                createdBy: form.createdBy,
                locale: i18nContent?.locale?.code
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
