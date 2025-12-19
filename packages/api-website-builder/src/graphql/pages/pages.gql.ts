import { GetSettings } from "@webiny/api-core/features/GetSettings";
import { UpdateSettingsUseCase } from "@webiny/api-core/features/UpdateSettings";
import {
    ErrorResponse,
    GraphQLSchemaPlugin,
    ListResponse,
    NotFoundError,
    Response
} from "@webiny/handler-graphql";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { WEBSITE_BUILDER_INTEGRATIONS, WEBSITE_BUILDER_SETTINGS } from "~/constants.js";
import type { WebsiteBuilderContext } from "~/context/types.js";
import { pagesTypeDefs } from "~/graphql/pages/pages.typeDefs.js";
import { PAGE_MODEL_ID } from "~/context/pages/pages.context.js";

export const createPagesSchema = () => {
    const pageGraphQL = new GraphQLSchemaPlugin<WebsiteBuilderContext>({
        typeDefs: pagesTypeDefs,
        resolvers: {
            WbQuery: {
                getPageModel: async (_, __, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.cms.getModel(PAGE_MODEL_ID);
                    });
                },
                getPageByPath: async (_, { path }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);

                        const page = await context.websiteBuilder.pages.getByPath(path);

                        if (!page) {
                            throw new NotFoundError(`Page ${path} was not found!`);
                        }

                        return {
                            id: page.id,
                            properties: page.properties,
                            bindings: page.bindings,
                            elements: page.elements
                        };
                    });
                },
                getPageById: async (_, { id }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.pages.getById(id);
                    });
                },
                getPageRevisions: async (_, { entryId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const revisions = await context.websiteBuilder.pages.getRevisions(entryId);

                        return revisions.map(page => {
                            return {
                                id: page.id,
                                entryId: page.entryId,
                                version: page.version,
                                title: page.properties.title,
                                status: page.status,
                                locked: page.locked,
                                savedOn: page.savedOn
                            };
                        });
                    });
                },
                listPages: async (_, args: any, context) => {
                    try {
                        ensureAuthentication(context);
                        const [entries, meta] = await context.websiteBuilder.pages.list(args);
                        return new ListResponse(entries, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                getSettings: async (_, __, context) => {
                    ensureAuthentication(context);

                    const getSettings = context.container.resolve(GetSettings);
                    const result = await getSettings.execute(WEBSITE_BUILDER_SETTINGS);

                    if (result.isFail()) {
                        return new Response({
                            // TODO: add a WB GetSettings use case and a Settings domain model with defaults.
                            previewDomain: "http://localhost:3000"
                        });
                    }

                    const settings = result.value.data;

                    return new Response({
                        // TODO: add a WB GetSettings use case and a Settings domain model with defaults.
                        previewDomain: settings.previewDomain ?? "http://localhost:3000"
                    });
                },
                getIntegrations: async (_, __, context) => {
                    ensureAuthentication(context);
                    const getSettings = context.container.resolve(GetSettings);
                    const settings = await getSettings.execute(WEBSITE_BUILDER_INTEGRATIONS);
                    if (settings.isFail()) {
                        return new Response({});
                    }

                    return new Response(settings.value.data);
                }
            },
            WbMutation: {
                createPage: async (_, { data }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.pages.create(data);
                    });
                },
                updatePage: async (_, { id, data }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.pages.update(id, data);
                    });
                },
                duplicatePage: async (_, { id }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.pages.duplicate({ id });
                    });
                },
                publishPage: async (_, { id }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.pages.publish({ id });
                    });
                },
                unpublishPage: async (_, { id }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.pages.unpublish({ id });
                    });
                },
                movePage: async (_, { id, folderId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        await context.websiteBuilder.pages.move({ id, folderId });
                        return true;
                    });
                },
                createPageRevisionFrom: async (_, { id }, context) => {
                    return resolve(() => {
                        ensureAuthentication(context);
                        return context.websiteBuilder.pages.createRevisionFrom({ id });
                    });
                },
                deletePage: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        await context.websiteBuilder.pages.delete({ id });
                        return true;
                    });
                },
                updateSettings: async (_, args, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const saveSettings = context.container.resolve(UpdateSettingsUseCase);

                        await saveSettings.execute({
                            name: WEBSITE_BUILDER_SETTINGS,
                            data: args.data
                        });

                        return true;
                    });
                },
                updateIntegrations: async (_, args, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const saveSettings = context.container.resolve(UpdateSettingsUseCase);

                        await saveSettings.execute({
                            name: WEBSITE_BUILDER_INTEGRATIONS,
                            data: args.data
                        });

                        return true;
                    });
                }
            }
        }
    });

    pageGraphQL.name = "wb.graphql.pages";

    return pageGraphQL;
};
