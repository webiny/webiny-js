import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { FormsCRUD } from "../../../types";
import { hasRwd } from "./utils/formResolversUtils";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { formBuilder, elasticSearch } = context;
    const forms: FormsCRUD = formBuilder?.crud?.forms;
    const { id } = args;
    // If permission has "rwd" property set, but "d" is not part of it, bail.
    const formBuilderFormPermission = await context.security.getPermission("forms.forms");
    if (formBuilderFormPermission && !hasRwd({ formBuilderFormPermission, rwd: "d" })) {
        return new NotAuthorizedResponse();
    }

    try {
        const existingForm = await forms.getForm(id);

        if (!existingForm) {
            return new NotFoundResponse(`Form with id:"${id}" not found!`);
        }
        // Before delete
        if (existingForm.version > 1 && existingForm.latestVersion) {
            await forms.markPreviousLatestVersion({
                parentId: existingForm.parent,
                version: existingForm.version,
                latestVersion: true
            });
        }

        // If the deleted form is the root form - delete its revisions
        if (existingForm.id === existingForm.parent) {
            // Get all revisions
            // Note: We're using `ES` here to avoid DDB reads.
            const response = await elasticSearch.search({
                index: "form-builder",
                type: "_doc",
                body: {
                    query: {
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        constant_score: {
                            filter: {
                                bool: {
                                    must: [{ term: { "parent.keyword": existingForm.parent } }]
                                }
                            }
                        }
                    }
                }
            });

            const revisionIds = response?.body?.hits?.hits?.map(item => item._source.id);

            if (revisionIds.length > 1) {
                // Delete all revisions.
                await forms.deleteForms(revisionIds);

                return new Response(true);
            }
        }
        // Delete the form.
        await forms.deleteForm(id);

        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
