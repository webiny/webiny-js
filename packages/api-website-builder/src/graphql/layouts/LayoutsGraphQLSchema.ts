import { ErrorResponse, Response } from "@webiny/api-graphql";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { layoutsTypeDefs } from "~/graphql/layouts/layouts.typeDefs.js";
import { GetLayoutUseCase } from "~/features/layouts/GetLayout/index.js";
import { ListLayoutsUseCase } from "~/features/layouts/ListLayouts/index.js";
import { GetLayoutRevisionsUseCase } from "~/features/layouts/GetLayoutRevisions/index.js";
import { GetPageLayoutUseCase } from "~/features/layouts/GetPageLayout/index.js";
import { GetLayoutSettingsUseCase } from "~/features/layouts/GetLayoutSettings/index.js";
import { GetLayoutBySlugUseCase } from "~/features/layouts/GetLayoutBySlug/index.js";
import { ComposeLayoutUseCase } from "~/features/layouts/ComposeLayout/index.js";
import { GetLayoutUsageUseCase } from "~/features/layouts/GetLayoutUsage/index.js";
import { CreateLayoutUseCase } from "~/features/layouts/CreateLayout/index.js";
import { UpdateLayoutUseCase } from "~/features/layouts/UpdateLayout/index.js";
import { PublishLayoutUseCase } from "~/features/layouts/PublishLayout/index.js";
import { UnpublishLayoutUseCase } from "~/features/layouts/UnpublishLayout/index.js";
import { CreateLayoutRevisionFromUseCase } from "~/features/layouts/CreateLayoutRevisionFrom/index.js";
import { DeleteLayoutRevisionUseCase } from "~/features/layouts/DeleteLayoutRevision/index.js";
import { DeleteLayoutUseCase } from "~/features/layouts/DeleteLayout/index.js";
import { DuplicateLayoutUseCase } from "~/features/layouts/DuplicateLayout/index.js";
import { TranslateLayoutUseCase } from "~/features/layouts/TranslateLayout/index.js";
import { SetDefaultLayoutUseCase } from "~/features/layouts/SetDefaultLayout/index.js";
import { PageLayoutDtoMapper } from "./abstractions.js";

interface IdArgs {
    id: string;
}

interface EntryIdArgs {
    entryId: string;
}

interface GetPageLayoutArgs {
    id: string;
    language?: string | null;
}

interface GetLayoutBySlugArgs {
    slug: string;
    language?: string | null;
}

interface CreateLayoutArgs {
    data: CreateLayoutUseCase.Data;
}

interface UpdateLayoutArgs {
    id: string;
    data: UpdateLayoutUseCase.Data;
}

interface TranslateLayoutArgs {
    id: string;
    language: string;
}

interface SetDefaultLayoutArgs {
    id?: string | null;
}

interface ResultLike<T> {
    isFail(): boolean;
    error?: any;
    value?: T;
}

const toResponse = <T>(result: ResultLike<T>) => {
    if (result.isFail()) {
        return new ErrorResponse(result.error);
    }
    return new Response(result.value);
};

const toBooleanResponse = (result: ResultLike<unknown>) => {
    if (result.isFail()) {
        return new ErrorResponse(result.error);
    }
    return new Response(true);
};

// The use cases authorize every operation: anonymous identities lack the page permissions.
class Schema implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-website-builder/LayoutsGraphQLSchema");

    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(layoutsTypeDefs);

        builder.addResolver<IdArgs>({
            dependencies: [GetLayoutUseCase],
            path: "WbQuery.getLayout",
            resolver(getLayout: GetLayoutUseCase.Interface) {
                return async ({ args }) => toResponse(await getLayout.execute(args.id));
            }
        });

        builder.addResolver({
            dependencies: [ListLayoutsUseCase],
            path: "WbQuery.listLayouts",
            resolver(listLayouts: ListLayoutsUseCase.Interface) {
                return async () => toResponse(await listLayouts.execute());
            }
        });

        builder.addResolver<EntryIdArgs>({
            dependencies: [GetLayoutRevisionsUseCase],
            path: "WbQuery.getLayoutRevisions",
            resolver(getLayoutRevisions: GetLayoutRevisionsUseCase.Interface) {
                return async ({ args }) =>
                    toResponse(await getLayoutRevisions.execute(args.entryId));
            }
        });

        builder.addResolver<GetPageLayoutArgs>({
            dependencies: [GetPageLayoutUseCase],
            path: "WbQuery.getPageLayout",
            resolver(getPageLayout: GetPageLayoutUseCase.Interface) {
                return async ({ args }) =>
                    toResponse(
                        await getPageLayout.execute({ layoutId: args.id, language: args.language })
                    );
            }
        });

        builder.addResolver<GetLayoutBySlugArgs>({
            dependencies: [GetLayoutBySlugUseCase, ComposeLayoutUseCase],
            path: "WbQuery.getLayoutBySlug",
            resolver(
                getLayoutBySlug: GetLayoutBySlugUseCase.Interface,
                composeLayout: ComposeLayoutUseCase.Interface
            ) {
                return async ({ args }) => {
                    const result = await getLayoutBySlug.execute({
                        slug: args.slug,
                        language: args.language
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    if (!result.value) {
                        return new Response(null);
                    }
                    return new Response(
                        await composeLayout.execute(result.value, { language: args.language })
                    );
                };
            }
        });

        // Reading the layout authorizes it; the usage itself isn't authorized.
        builder.addResolver<IdArgs>({
            dependencies: [GetLayoutUseCase, GetLayoutUsageUseCase],
            path: "WbQuery.getLayoutUsage",
            resolver(
                getLayout: GetLayoutUseCase.Interface,
                getLayoutUsage: GetLayoutUsageUseCase.Interface
            ) {
                return async ({ args }) => {
                    const layout = await getLayout.execute(args.id);
                    if (layout.isFail()) {
                        return new ErrorResponse(layout.error);
                    }
                    return toResponse(await getLayoutUsage.execute(layout.value));
                };
            }
        });

        builder.addResolver({
            dependencies: [GetLayoutSettingsUseCase],
            path: "WbQuery.getLayoutSettings",
            resolver(getLayoutSettings: GetLayoutSettingsUseCase.Interface) {
                return async () => toResponse(await getLayoutSettings.execute());
            }
        });

        builder.addResolver<CreateLayoutArgs>({
            dependencies: [CreateLayoutUseCase],
            path: "WbMutation.createLayout",
            resolver(createLayout: CreateLayoutUseCase.Interface) {
                return async ({ args }) => toResponse(await createLayout.execute(args.data));
            }
        });

        builder.addResolver<UpdateLayoutArgs>({
            dependencies: [UpdateLayoutUseCase],
            path: "WbMutation.updateLayout",
            resolver(updateLayout: UpdateLayoutUseCase.Interface) {
                return async ({ args }) =>
                    toResponse(await updateLayout.execute(args.id, args.data));
            }
        });

        builder.addResolver<IdArgs>({
            dependencies: [PublishLayoutUseCase],
            path: "WbMutation.publishLayout",
            resolver(publishLayout: PublishLayoutUseCase.Interface) {
                return async ({ args }) => toResponse(await publishLayout.execute({ id: args.id }));
            }
        });

        builder.addResolver<IdArgs>({
            dependencies: [UnpublishLayoutUseCase],
            path: "WbMutation.unpublishLayout",
            resolver(unpublishLayout: UnpublishLayoutUseCase.Interface) {
                return async ({ args }) =>
                    toResponse(await unpublishLayout.execute({ id: args.id }));
            }
        });

        builder.addResolver<IdArgs>({
            dependencies: [CreateLayoutRevisionFromUseCase],
            path: "WbMutation.createLayoutRevisionFrom",
            resolver(createRevisionFrom: CreateLayoutRevisionFromUseCase.Interface) {
                return async ({ args }) =>
                    toResponse(await createRevisionFrom.execute({ id: args.id }));
            }
        });

        builder.addResolver<IdArgs>({
            dependencies: [DeleteLayoutRevisionUseCase],
            path: "WbMutation.deleteLayoutRevision",
            resolver(deleteLayoutRevision: DeleteLayoutRevisionUseCase.Interface) {
                return async ({ args }) =>
                    toBooleanResponse(await deleteLayoutRevision.execute({ id: args.id }));
            }
        });

        builder.addResolver<IdArgs>({
            dependencies: [DeleteLayoutUseCase],
            path: "WbMutation.deleteLayout",
            resolver(deleteLayout: DeleteLayoutUseCase.Interface) {
                return async ({ args }) =>
                    toBooleanResponse(await deleteLayout.execute({ id: args.id }));
            }
        });

        builder.addResolver<IdArgs>({
            dependencies: [DuplicateLayoutUseCase],
            path: "WbMutation.duplicateLayout",
            resolver(duplicateLayout: DuplicateLayoutUseCase.Interface) {
                return async ({ args }) =>
                    toResponse(await duplicateLayout.execute({ id: args.id }));
            }
        });

        builder.addResolver<TranslateLayoutArgs>({
            dependencies: [TranslateLayoutUseCase],
            path: "WbMutation.translateLayout",
            resolver(translateLayout: TranslateLayoutUseCase.Interface) {
                return async ({ args }) =>
                    toResponse(
                        await translateLayout.execute({ id: args.id, language: args.language })
                    );
            }
        });

        builder.addResolver<SetDefaultLayoutArgs>({
            dependencies: [SetDefaultLayoutUseCase],
            path: "WbMutation.setDefaultLayout",
            resolver(setDefaultLayout: SetDefaultLayoutUseCase.Interface) {
                return async ({ args }) =>
                    toResponse(await setDefaultLayout.execute(args.id ?? null));
            }
        });

        // A page references its (source) layout by entry id; the mapper delivers it, as published.
        builder.addResolver({
            dependencies: [PageLayoutDtoMapper],
            path: "WbPage.layout",
            resolver(pageLayoutDtoMapper: PageLayoutDtoMapper.Interface) {
                return ({ parent }) => pageLayoutDtoMapper.toApi(parent);
            }
        });

        return builder;
    }
}

export const LayoutsGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: Schema,
    dependencies: []
});
