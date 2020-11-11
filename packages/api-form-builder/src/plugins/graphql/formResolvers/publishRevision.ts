import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { getFormId } from "./utils/formResolversUtils";

export const publishRevision: GraphQLFieldResolver = async (root, args, context) => {
    const forms = context?.formBuilder?.crud?.forms;
    const { id } = args;

    try {
        const existingForm = await forms.get(id);

        if (!existingForm) {
            return new NotFoundResponse(`Form with id:"${id}" not found!`);
        }

        const form = await forms.update({ data: { published: true }, existingForm });
        // Update form in "Elastic Search"
        // Note: For now I'm updating only the "publish" related fields we'll see it later.
        await context.elasticSearch.update({
            id,
            index: "form-builder",
            type: "_doc",
            body: {
                doc: {
                    savedOn: form.savedOn,
                    published: form.published,
                    publishedOn: form.publishedOn,
                    version: form.version,
                    locked: form.locked,
                    latestVersion: form.latestVersion,
                    status: form.status
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

export const unPublishRevision: GraphQLFieldResolver = async (root, args, context) => {
    const forms = context?.formBuilder?.crud?.forms;
    const { id } = args;

    try {
        const existingForm = await forms.get(id);

        if (!existingForm) {
            return new NotFoundResponse(`Form with id:"${id}" not found!`);
        }

        const form = await forms.update({ data: { published: false }, existingForm });
        // Update form in "Elastic Search"
        // Note: For now I'm updating only the "publish" related fields we'll see it later.
        await context.elasticSearch.update({
            id: getFormId(form),
            index: "form-builder",
            type: "_doc",
            body: {
                doc: {
                    savedOn: form.savedOn,
                    published: form.published,
                    publishedOn: form.publishedOn,
                    version: form.version,
                    locked: form.locked,
                    latestVersion: form.latestVersion,
                    status: form.status
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
