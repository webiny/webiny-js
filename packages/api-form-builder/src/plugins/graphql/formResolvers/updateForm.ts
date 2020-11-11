import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const forms = context?.formBuilder?.crud?.forms;
    const { id, data } = args;

    try {
        const existingForm = await forms.get(id);

        if (!existingForm) {
            return new NotFoundResponse(`Form with id:"${id}" not found!`);
        }

        const form = await forms.update({ data, existingForm });

        // Update form in "Elastic Search"
        // Note: For now I'm updating all the fields we'll see it later.
        await context.elasticSearch.update({
            id: form.id,
            index: "form-builder",
            type: "_doc",
            body: {
                doc: {
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
