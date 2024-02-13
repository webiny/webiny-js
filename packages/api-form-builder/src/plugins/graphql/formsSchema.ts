import {
    ErrorResponse,
    GraphQLSchemaPlugin,
    ListResponse,
    NotFoundResponse,
    Response
} from "@webiny/handler-graphql";

import {
    createFormsTypeDefs,
    CreateFormsTypeDefsParams
} from "~/plugins/graphql/createFormsTypeDefs";
import { FbForm, FormBuilderContext } from "~/types";

export const createFormsSchema = (params: CreateFormsTypeDefsParams) => {
    const formsGraphQL = new GraphQLSchemaPlugin<FormBuilderContext>({
        typeDefs: createFormsTypeDefs(params),
        resolvers: {
            FbForm: {
                overallStats: async (form: FbForm, _, { formBuilder }) => {
                    try {
                        return await formBuilder.getFormStats(form.id);
                    } catch (ex) {
                        console.log(`Could not fetch form "${form.id}" stats.`);
                        console.log(ex.message);
                    }
                    return {
                        views: 0,
                        submissions: 0,
                        conversionRate: 0
                    };
                },
                settings: async (form: FbForm, _, { formBuilder }) => {
                    const settings = await formBuilder.getSettings({ auth: false });

                    return {
                        ...form.settings,
                        reCaptcha: {
                            ...form.settings.reCaptcha,
                            settings: settings ? settings.reCaptcha : null
                        }
                    };
                }
            },
            FbQuery: {
                getForm: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.getForm(args.revision);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                getFormRevisions: async (_, args: any, { formBuilder }) => {
                    try {
                        const revisions = await formBuilder.getFormRevisions(args.id);

                        return new Response(revisions);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                listForms: async (_, __, { formBuilder }) => {
                    try {
                        const [data, meta] = await formBuilder.listForms();

                        return new ListResponse(data, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                getPublishedForm: async (_, args: any, { formBuilder }) => {
                    if (!args.revision && !args.parent) {
                        return new NotFoundResponse("Revision ID or Form ID missing.");
                    }

                    let form;

                    if (args.revision) {
                        /**
                         * This fetches the latest published revision for given revision id
                         */
                        form = await formBuilder.getPublishedFormRevisionById(args.revision);
                    } else if (args.parent) {
                        /**
                         * This fetches the latest published revision for given parent form
                         */
                        form = await formBuilder.getLatestPublishedFormRevision(args.parent);
                    }

                    if (!form) {
                        return new NotFoundResponse("The requested form was not found.");
                    }

                    return new Response(form);
                }
            },
            FbMutation: {
                /**
                 * Creates a new form
                 */
                createForm: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.createForm(args.data);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Deletes the entire form with all of its revisions
                 */
                deleteForm: async (_, args: any, { formBuilder }) => {
                    try {
                        await formBuilder.deleteForm(args.id);

                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Creates a revision from the given revision
                 */
                createRevisionFrom: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.createFormRevision(args.revision);
                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Updates revision
                 */
                updateRevision: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.updateForm(args.revision, args.data);
                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Publish revision (must be given an exact revision ID to publish)
                 */
                publishRevision: async (_, { revision }, { formBuilder }) => {
                    try {
                        const form = await formBuilder.publishForm(revision);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                unpublishRevision: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.unpublishForm(args.revision);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                /**
                 * Delete a revision
                 */
                deleteRevision: async (_, args: any, { formBuilder }) => {
                    try {
                        await formBuilder.deleteFormRevision(args.revision);

                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                saveFormView: async (_, args: any, { formBuilder }) => {
                    try {
                        const form = await formBuilder.incrementFormViews(args.revision);

                        return new Response(form);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    });
    formsGraphQL.name = "fb.graphql.forms";

    return formsGraphQL;
};
