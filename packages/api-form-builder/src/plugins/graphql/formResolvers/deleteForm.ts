import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { formBuilder, elasticSearch } = context;
    const forms = formBuilder?.crud?.forms;
    const { id } = args;

    try {
        const existingForm = await forms.get(id);

        if (!existingForm) {
            return new NotFoundResponse(`Form with id:"${id}" not found!`);
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
                await forms.deleteAll(revisionIds);
                // Delete all index from "ES"
                const body = revisionIds.map(id => ({
                    delete: { _index: "form-builder", _id: id }
                }));
                const { body: bulkResponse } = await elasticSearch.bulk({ body });
                if (bulkResponse.errors) {
                    console.info("Error: While deleting indexed `forms`.");
                }

                return new Response(true);
            }
        }
        await forms.delete(id);
        // Delete form with "id" from "Elastic Search"
        await context.elasticSearch.delete({
            id,
            index: "form-builder",
            type: "_doc"
        });
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
