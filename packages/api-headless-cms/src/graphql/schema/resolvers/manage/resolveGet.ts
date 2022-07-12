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
    /**
     * In case we are searching for latest or published but we do not have entryId, we need to set it.
     * OR if version was not passed we will find latest or published, depending on status sent.
     */
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
                    ? await context.cms.getPublishedEntriesByIds(model, [entryId])
                    : await context.cms.getLatestEntriesByIds(model, [entryId]);
                return new Response(result.shift() || null);
            }

            const entry = await context.cms.getEntryById(model, revision as string);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
