import { ErrorResponse, ListResponse } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { themeTypeDefs } from "./theme.typeDefs.js";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { CreateThemeUseCase } from "~/features/CreateTheme/index.js";
import { GetThemeByIdUseCase } from "~/features/GetThemeById/index.js";
import { ListThemesUseCase } from "~/features/ListThemes/index.js";
import { UpdateThemeUseCase } from "~/features/UpdateTheme/index.js";
import { DeleteThemeUseCase } from "~/features/DeleteTheme/index.js";
import { GetThemeRevisionsUseCase } from "~/features/GetThemeRevisions/index.js";
import { CreateThemeRevisionFromUseCase } from "~/features/CreateThemeRevisionFrom/index.js";
import { PublishThemeUseCase } from "~/features/PublishTheme/index.js";
import { ActivateThemeUseCase, DeactivateThemeUseCase } from "~/features/ActivateTheme/index.js";
import { GetActiveThemeUseCase } from "~/features/GetActiveTheme/index.js";

/**
 * Resolvers are thin: authenticate, delegate to a use case, map the `Result` onto the
 * `{ data, error }` envelope. Authorization lives in the use cases, so the same rules apply however
 * the operation is reached.
 */
export const addThemeSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(themeTypeDefs);

    builder.addResolver({
        path: "ThemeQuery.getTheme",
        dependencies: [GetThemeByIdUseCase],
        resolver(getThemeById) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await getThemeById.execute(args.id);
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "ThemeQuery.listThemes",
        dependencies: [ListThemesUseCase],
        resolver(listThemes) {
            return async ({ args, context }) => {
                try {
                    ensureAuthentication(context);

                    const result = await listThemes.execute({
                        where: args.where,
                        sort: args.sort,
                        limit: args.limit,
                        after: args.after,
                        search: args.search
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    const { themes, meta } = result.value;
                    return new ListResponse(themes, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            };
        }
    });

    builder.addResolver({
        path: "ThemeQuery.getThemeRevisions",
        dependencies: [GetThemeRevisionsUseCase],
        resolver(getThemeRevisions) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await getThemeRevisions.execute(args.entryId);
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "ThemeQuery.getActiveTheme",
        dependencies: [GetActiveThemeUseCase],
        resolver(getActiveTheme) {
            return ({ context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await getActiveTheme.execute();
                    if (result.isFail()) {
                        throw result.error;
                    }

                    // `{ theme: null, pointer: null }` is a legitimate answer, not an error.
                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "ThemeMutation.createTheme",
        dependencies: [CreateThemeUseCase],
        resolver(createTheme) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await createTheme.execute(args.data);
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "ThemeMutation.updateTheme",
        dependencies: [UpdateThemeUseCase],
        resolver(updateTheme) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await updateTheme.execute({ id: args.id, data: args.data });
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "ThemeMutation.deleteTheme",
        dependencies: [DeleteThemeUseCase],
        resolver(deleteTheme) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await deleteTheme.execute({ id: args.id });
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return true;
                });
        }
    });

    builder.addResolver({
        path: "ThemeMutation.createThemeRevisionFrom",
        dependencies: [CreateThemeRevisionFromUseCase],
        resolver(createRevisionFrom) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await createRevisionFrom.execute({ id: args.id });
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "ThemeMutation.publishTheme",
        dependencies: [PublishThemeUseCase],
        resolver(publishTheme) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await publishTheme.execute({ id: args.id });
                    if (result.isFail()) {
                        // A ThemeNotPublishableError carries the full blocker list in `error.data`,
                        // which the envelope preserves — the UI renders it as a checklist.
                        throw result.error;
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "ThemeMutation.activateTheme",
        dependencies: [ActivateThemeUseCase],
        resolver(activateTheme) {
            return ({ args, context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await activateTheme.execute({ id: args.id });
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
        }
    });

    builder.addResolver({
        path: "ThemeMutation.deactivateTheme",
        dependencies: [DeactivateThemeUseCase],
        resolver(deactivateTheme) {
            return ({ context }) =>
                resolve(async () => {
                    ensureAuthentication(context);

                    const result = await deactivateTheme.execute();
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                });
        }
    });
};
