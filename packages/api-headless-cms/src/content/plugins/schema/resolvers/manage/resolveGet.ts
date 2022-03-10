import WebinyError from "@webiny/error";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { CmsEntryResolverFactory as ResolverFactory } from "~/types";
import { parseIdentifier } from "@webiny/utils";

interface ResolveGetArgs {
    revision: string;
}

type ResolveGet = ResolverFactory<any, ResolveGetArgs>;

interface ValuesFromArgsParams {
    type?: "published" | "latest";
    latest?: boolean;
    revision: string;
}
interface ArgsValues {
    published?: boolean;
    entryId?: string;
    revision?: string;
}

const possibleTypes = ["published", "latest"];

const getValuesFromArgs = (params?: ValuesFromArgsParams): ArgsValues => {
    const { type, revision } = params || {};
    if (!revision) {
        throw new WebinyError(
            "Missing revision ID in the GraphQL arguments.",
            "GRAPHQL_ARGS_ERROR",
            {
                ...(params || {})
            }
        );
    }
    if (type && possibleTypes.includes(type) === false) {
        throw new WebinyError(
            `Status cannot be anything other than ${possibleTypes.join(", ")}.`,
            "GRAPHQL_ARGS_ERROR",
            {
                ...params
            }
        );
    }
    const { id, version } = parseIdentifier(revision);
    /**
     * In case we are searching for latest or published but we do not have entryId, we need to set it.
     * OR if version was not passed we will find latest or published, depending on type sent.
     */
    if (type || !version) {
        return {
            published: type === "published",
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
        const { entryId, published, revision } = getValuesFromArgs(args);

        try {
            if (entryId) {
                const result = published
                    ? await context.cms.getPublishedEntriesByIds(model, [entryId])
                    : await context.cms.getLatestEntriesByIds(model, [entryId]);
                return new Response(result.pop() || null);
            }
            const entry = await context.cms.getEntryById(model, revision as string);
            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
