import { ErrorResponse, ListResponse, NotFoundError, Response } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { WEBSITE_BUILDER_INTEGRATIONS, WEBSITE_BUILDER_SETTINGS } from "~/constants.js";
import { pagesTypeDefs } from "~/graphql/pages/pages.typeDefs.js";
import { PageModelProvider } from "~/domain/page/abstractions.js";
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
import { TranslatePageUseCase } from "~/features/pages/TranslatePage/index.js";
import { CreatePageRevisionFromUseCase } from "~/features/pages/CreatePageRevisionFrom/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ListDeletedPagesUseCase } from "~/features/pages/ListDeletedPages/index.js";
import { TrashPageUseCase } from "~/features/pages/TrashPage/index.js";
import { RestorePageUseCase } from "~/features/pages/RestorePage/index.js";
import { GetPageLanguagePathsUseCase } from "~/features/pages/GetPageLanguagePaths/index.js";
import { UpdatePageRevisionDescriptionUseCase } from "~/features/pages/UpdatePageRevisionDescription/index.js";

export const addPagesSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(pagesTypeDefs);

    builder.addResolver({
        path: "WbQuery.getPageModel",
        dependencies: [PageModelProvider],
        resolver(pageModelProvider) {
            return ({ context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    return pageModelProvider.get();
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.getPageByPath",
        dependencies: [GetPageByPathUseCase],
        resolver(getPageByPath) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await getPageByPath.execute(args.path);

                    if (result.isFail()) {
                        throw new NotFoundError(`Page ${args.path} was not found!`);
                    }

                    const page = result.value;
                    return {
                        id: page.id,
                        entryId: page.entryId,
                        properties: page.properties,
                        bindings: page.bindings,
                        elements: page.elements
                    };
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.getPageById",
        dependencies: [GetPageByIdUseCase],
        resolver(getPageById) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await getPageById.execute(args.id);

                    if (result.isFail()) {
                        throw new NotFoundError(`Page with id "${args.id}" was not found!`);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.getPageRevisions",
        dependencies: [GetPageRevisionsUseCase],
        resolver(getPageRevisions) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await getPageRevisions.execute(args.entryId);

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    const revisions = result.value;
                    return revisions.map((page: any) => {
                        return {
                            id: page.id,
                            entryId: page.entryId,
                            version: page.version,
                            title: page.properties.title,
                            status: page.status,
                            locked: page.locked,
                            savedOn: page.savedOn,
                            createdOn: page.createdOn,
                            createdBy: page.createdBy,
                            revisionDescription: page.revisionDescription
                        };
                    });
                });
        }
    });

    builder.addResolver({
        path: "WbQuery.listPages",
        dependencies: [ListPagesUseCase],
        resolver(listPages) {
            return async ({ args, context }) => {
                try {
                    ensureAuthentication(context);
                    const result = await listPages.execute(args);

                    if (result.isFail()) {
                        throw result.error;
                    }

                    const { pages, meta } = result.value;
                    return new ListResponse(pages, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            };
        }
    });

    builder.addResolver({
        path: "WbQuery.listDeletedPages",
        dependencies: [ListDeletedPagesUseCase],
        resolver(listDeletedPages) {
            return async ({ args, context }) => {
                try {
                    ensureAuthentication(context);
                    const result = await listDeletedPages.execute(args);

                    if (result.isFail()) {
                        throw result.error;
                    }

                    const { pages, meta } = result.value;
                    return new ListResponse(pages, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            };
        }
    });

    builder.addResolver({
        path: "WbQuery.getSettings",
        dependencies: [KeyValueStore],
        resolver(keyValueStore) {
            return async ({ context }) => {
                ensureAuthentication(context);

                const result = await keyValueStore.get(WEBSITE_BUILDER_SETTINGS);

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
            };
        }
    });

    builder.addResolver({
        path: "WbQuery.getIntegrations",
        dependencies: [KeyValueStore],
        resolver(keyValueStore) {
            return async ({ context }) => {
                ensureAuthentication(context);
                const settings = await keyValueStore.get(WEBSITE_BUILDER_INTEGRATIONS);
                if (settings.isFail()) {
                    return new Response({});
                }

                return new Response(settings.value);
            };
        }
    });

    builder.addResolver({
        path: "WbMutation.createPage",
        dependencies: [CreatePageUseCase],
        resolver(createPage) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await createPage.execute(args.data);

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.updatePage",
        dependencies: [UpdatePageUseCase],
        resolver(updatePage) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await updatePage.execute(args.id, args.data);

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.updatePageRevisionDescription",
        dependencies: [UpdatePageRevisionDescriptionUseCase],
        resolver(updatePageRevisionDescription) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await updatePageRevisionDescription.execute(
                        args.id,
                        args.revisionDescription
                    );

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.duplicatePage",
        dependencies: [DuplicatePageUseCase],
        resolver(duplicatePage) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await duplicatePage.execute({ id: args.id });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.translatePage",
        dependencies: [TranslatePageUseCase],
        resolver(translatePage) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await translatePage.execute({
                        pageId: args.pageId,
                        languageCode: args.languageCode,
                        folderId: args.folderId
                    });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.publishPage",
        dependencies: [PublishPageUseCase],
        resolver(publishPage) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await publishPage.execute({ id: args.id });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.unpublishPage",
        dependencies: [UnpublishPageUseCase],
        resolver(unpublishPage) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await unpublishPage.execute({ id: args.id });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.movePage",
        dependencies: [MovePageUseCase],
        resolver(movePage) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await movePage.execute({ id: args.id, folderId: args.folderId });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return true;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.createPageRevisionFrom",
        dependencies: [CreatePageRevisionFromUseCase],
        resolver(createRevision) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await createRevision.execute({ id: args.id });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.deletePage",
        // If the "permanently" flag is set we permanently delete the page; otherwise we trash it
        // (a two-step deletion where pages first go to trash and can be restored). Both use-cases are
        // declared as dependencies and the right one is picked per request from `args.permanently`.
        dependencies: [DeletePageUseCase, TrashPageUseCase],
        resolver(deletePageUseCase, trashPageUseCase) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const deletePage = args.permanently ? deletePageUseCase : trashPageUseCase;
                    const result = await deletePage.execute({
                        id: args.id
                    });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return true;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.restorePage",
        dependencies: [RestorePageUseCase],
        resolver(restorePage) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);
                    const result = await restorePage.execute({
                        id: args.id
                    });

                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }

                    return result.value;
                });
        }
    });

    // TODO: move these settings updates into dedicated use cases
    builder.addResolver({
        path: "WbMutation.updateSettings",
        dependencies: [KeyValueStore],
        resolver(keyValueStore) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context, { permission: "wb.settings" });
                    await keyValueStore.set(WEBSITE_BUILDER_SETTINGS, args.data);

                    return true;
                });
        }
    });

    builder.addResolver({
        path: "WbMutation.updateIntegrations",
        dependencies: [KeyValueStore],
        resolver(keyValueStore) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context, { permission: "wb.settings" });
                    await keyValueStore.set(WEBSITE_BUILDER_INTEGRATIONS, args.data);

                    return true;
                });
        }
    });

    builder.addResolver<unknown, any>({
        path: "WbPage.languagePaths",
        dependencies: [GetPageLanguagePathsUseCase],
        resolver(getLanguagePaths) {
            return async ({ parent }) => {
                const properties = parent.properties ?? {};
                const rootEntryId: string | undefined = properties.sourcePage ?? parent.entryId;

                if (!rootEntryId) {
                    return {};
                }

                const result = await getLanguagePaths.execute(rootEntryId);

                return result.isFail() ? {} : result.value;
            };
        }
    });
};
