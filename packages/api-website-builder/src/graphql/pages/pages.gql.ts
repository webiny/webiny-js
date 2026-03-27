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
import { pagesTypeDefs } from "~/graphql/pages/pages.typeDefs.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { PageModel } from "~/domain/page/abstractions.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { GetPageByPathUseCase } from "~/features/pages/GetPageByPath/index.js";
import { GetPageRevisionsUseCase } from "~/features/pages/GetPageRevisions/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/index.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { UpdatePageUseCase } from "~/features/pages/UpdatePage/index.js";
import { DeletePageUseCase } from "~/features/pages/DeletePage/index.js";
import { PublishPageUseCase } from "~/features/pages/PublishPage/index.js";
import { UnpublishPageUseCase } from "~/features/pages/UnpublishPage/index.js";
import { MovePageUseCase } from "~/features/pages/MovePage/index.js";
import { DuplicatePageUseCase } from "~/features/pages/DuplicatePage/index.js";
import { CreatePageRevisionFromUseCase } from "~/features/pages/CreatePageRevisionFrom/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ListDeletedPagesUseCase } from "~/features/pages/ListDeletedPages/index.js";
import { TrashPageUseCase } from "~/features/pages/TrashPage/index.js";
import { RestorePageUseCase } from "~/features/pages/RestorePage/index.js";

export const createPagesSchema = () => {
    const pageGraphQL = new GraphQLSchemaPlugin<ApiCoreContext>({
        typeDefs: pagesTypeDefs,
        resolvers: {
            WbQuery: {
                getPageModel: async (_, __, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        return context.container.resolve(PageModel);
                    });
                },
                getPageByPath: async (_, { path }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);

                        const getPageByPath = context.container.resolve(GetPageByPathUseCase);
                        const result = await getPageByPath.execute(path);

                        if (result.isFail()) {
                            throw new NotFoundError(`Page ${path} was not found!`);
                        }

                        const page = result.value;
                        return {
                            id: page.id,
                            properties: page.properties,
                            bindings: page.bindings,
                            elements: page.elements
                        };
                    });
                },
                getPageById: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const getPageById = context.container.resolve(GetPageByIdUseCase);
                        const result = await getPageById.execute(id);

                        if (result.isFail()) {
                            throw new NotFoundError(`Page with id "${id}" was not found!`);
                        }

                        return result.value;
                    });
                },
                getPageRevisions: async (_, { entryId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const getPageRevisions = context.container.resolve(GetPageRevisionsUseCase);
                        const result = await getPageRevisions.execute(entryId);

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        const revisions = result.value;
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
                        const listPages = context.container.resolve(ListPagesUseCase);
                        const result = await listPages.execute(args);

                        if (result.isFail()) {
                            throw result.error;
                        }

                        const { pages, meta } = result.value;
                        return new ListResponse(pages, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                listDeletedPages: async (_, args: any, context) => {
                    try {
                        ensureAuthentication(context);
                        const listPages = context.container.resolve(ListDeletedPagesUseCase);
                        const result = await listPages.execute(args);

                        if (result.isFail()) {
                            throw result.error;
                        }

                        const { pages, meta } = result.value;
                        return new ListResponse(pages, meta);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                getSettings: async (_, __, context) => {
                    ensureAuthentication(context);

                    const keyValueStore = context.container.resolve(KeyValueStore);
                    const result = await keyValueStore.get<{ previewDomain: string | undefined }>(
                        WEBSITE_BUILDER_SETTINGS
                    );

                    if (result.isFail()) {
                        return new Response({
                            // TODO: add a WB GetSettings use case and a Settings domain model with defaults.
                            previewDomain: "http://localhost:3000"
                        });
                    }

                    const settings = result.value;

                    return new Response({
                        // TODO: add a WB GetSettings use case and a Settings domain model with defaults.
                        previewDomain: settings.previewDomain ?? "http://localhost:3000"
                    });
                },
                getIntegrations: async (_, __, context) => {
                    ensureAuthentication(context);
                    const keyValueStore = context.container.resolve(KeyValueStore);
                    const settings = await keyValueStore.get(WEBSITE_BUILDER_INTEGRATIONS);
                    if (settings.isFail()) {
                        return new Response({});
                    }

                    return new Response(settings.value);
                }
            },
            WbMutation: {
                createPage: async (_, { data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const createPage = context.container.resolve(CreatePageUseCase);
                        const result = await createPage.execute(data);

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return result.value;
                    });
                },
                updatePage: async (_, { id, data }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const updatePage = context.container.resolve(UpdatePageUseCase);
                        const result = await updatePage.execute(id, data);

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return result.value;
                    });
                },
                duplicatePage: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const duplicatePage = context.container.resolve(DuplicatePageUseCase);
                        const result = await duplicatePage.execute({ id });

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return result.value;
                    });
                },
                publishPage: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const publishPage = context.container.resolve(PublishPageUseCase);
                        const result = await publishPage.execute({ id });

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return result.value;
                    });
                },
                unpublishPage: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const unpublishPage = context.container.resolve(UnpublishPageUseCase);
                        const result = await unpublishPage.execute({ id });

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return result.value;
                    });
                },
                movePage: async (_, { id, folderId }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const movePage = context.container.resolve(MovePageUseCase);
                        const result = await movePage.execute({ id, folderId });

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return true;
                    });
                },
                createPageRevisionFrom: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const createRevision = context.container.resolve(
                            CreatePageRevisionFromUseCase
                        );
                        const result = await createRevision.execute({ id });

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return result.value;
                    });
                },
                deletePage: async (_, { id, permanently }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const deletePage = context.container.resolve(
                            /**
                             * If "permanent" flag is set, we want to permanently delete the page. Otherwise, we just want to trash it.
                             * This allows us to have a two-step deletion process, where pages are first moved to trash and can be restored from there, before being permanently deleted.
                             */
                            permanently ? DeletePageUseCase : TrashPageUseCase
                        );
                        const result = await deletePage.execute({
                            id
                        });

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return true;
                    });
                },
                restorePage: async (_, { id }, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context);
                        const restorePage = context.container.resolve(RestorePageUseCase);
                        const result = await restorePage.execute({
                            id
                        });

                        if (result.isFail()) {
                            throw new Error(result.error.message);
                        }

                        return result.value;
                    });
                },
                // TODO: move these settings updates into dedicated use cases
                updateSettings: async (_, args, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context, { permission: "wb.settings" });
                        const keyValueStore = context.container.resolve(KeyValueStore);
                        await keyValueStore.set(WEBSITE_BUILDER_SETTINGS, args.data);

                        return true;
                    });
                },
                updateIntegrations: async (_, args, context) => {
                    return resolve(async () => {
                        ensureAuthentication(context, { permission: "wb.settings" });
                        const keyValueStore = context.container.resolve(KeyValueStore);
                        await keyValueStore.set(WEBSITE_BUILDER_INTEGRATIONS, args.data);

                        return true;
                    });
                }
            }
        }
    });

    pageGraphQL.name = "wb.graphql.pages";

    return pageGraphQL;
};
