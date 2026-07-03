import WebinyError from "@webiny/error";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses.js";
import type { CmsEntryResolverFactory as ResolverFactory } from "~/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { GetPublishedEntriesByIdsUseCase } from "~/features/contentEntry/GetPublishedEntriesByIds/index.js";
import { GetLatestEntriesByIdsUseCase } from "~/features/contentEntry/GetLatestEntriesByIds/index.js";
import { GetEntryByIdUseCase } from "~/features/contentEntry/GetEntryById/index.js";

interface ResolveGetArgs {
    revision: string;
}

type ResolveGet = ResolverFactory<any, ResolveGetArgs>;

interface ValuesFromArgsParams {
    status?: "published" | "latest";
    entryId?: string;
    revision: string;
}
interface ArgsValues {
    published?: boolean;
    entryId?: string;
    revision?: string;
}

const possibleTypes = ["published", "latest"];

const getValuesFromArgs = (args?: ValuesFromArgsParams): ArgsValues => {
    const { status, revision, entryId } = args || {};
    if (!revision && !entryId) {
        throw new WebinyError(
            "You must pass a 'revision' or an 'entryId' argument.",
            "GRAPHQL_ARGS_ERROR",
            {
                ...(args || {})
            }
        );
    } else if (revision && entryId) {
        throw new WebinyError(
            "Cannot have both of GraphQL query arguments: revision and entryId. Must have only one.",
            "GRAPHQL_ARGS_ERROR",
            {
                ...args
            }
        );
    }
    if (status && possibleTypes.includes(status) === false) {
        throw new WebinyError(
            `Status can only be one of the following values: ${possibleTypes.join(" | ")}.`,
            "GRAPHQL_ARGS_ERROR",
            {
                ...args
            }
        );
    }
    if (status || !revision) {
        const { id } = parseIdentifier(entryId || revision);
        return {
            published: status === "published",
            entryId: id
        };
    }
    return {
        revision
    };
};

export const resolveGet: ResolveGet =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const { entryId, published, revision } = getValuesFromArgs(args);

            if (entryId) {
                const result = published
                    ? await context.container
                          .resolve(GetPublishedEntriesByIdsUseCase)
                          .execute(model, [entryId])
                    : await context.container
                          .resolve(GetLatestEntriesByIdsUseCase)
                          .execute(model, [entryId]);
                if (result.isFail()) {
                    throw result.error;
                }
                return new Response(result.value[0] || null);
            }

            const result = await context.container
                .resolve(GetEntryByIdUseCase)
                .execute(model, revision as string);
            if (result.isFail()) {
                throw result.error;
            }
            return new Response(result.value);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
