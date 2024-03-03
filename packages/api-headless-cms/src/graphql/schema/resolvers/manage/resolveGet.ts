import WebinyError from "@webiny/error";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";
import { parseIdentifier } from "@webiny/utils";

interface ResolveGetArgs {
    revision: string;
}

type ResolveGet = ResolverFactory<any, ResolveGetArgs>;

interface ValuesFromArgsParams {
    status?: "published" | "latest";
    entryId?: string;
    revision: string;
    deleted?: boolean;
}
interface ArgsValues {
    published?: boolean;
    entryId?: string;
    revision?: string;
    deleted: boolean;
}

const possibleTypes = ["published", "latest"];

const getValuesFromArgs = (args?: ValuesFromArgsParams): ArgsValues => {
    const { status, revision, entryId, deleted = false } = args || {};
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
    /**
     * In case we are searching for latest or published but we do not have entryId, we need to set it.
     * OR if version was not passed we will find latest or published, depending on status sent.
     */
    if (status || !revision) {
        const { id } = parseIdentifier(entryId || revision);
        return {
            published: status === "published",
            entryId: id,
            deleted
        };
    }
    return {
        revision,
        deleted
    };
};

export const resolveGet: ResolveGet =
    ({ model }) =>
    async (_, args: any, context) => {
        try {
            const { entryId, published, revision, deleted } = getValuesFromArgs(args);

            if (entryId) {
                const result = published
                    ? await context.cms.getPublishedEntriesByIds(model, [entryId], deleted)
                    : await context.cms.getLatestEntriesByIds(model, [entryId], deleted);
                return new Response(result.shift() || null);
            }

            const entry = await context.cms.getEntryById(model, revision as string, deleted);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
