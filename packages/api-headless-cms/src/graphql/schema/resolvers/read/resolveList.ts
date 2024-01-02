import { ListResponse, ListErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsEntryMeta, CmsEntryResolverFactory as ResolverFactory, CmsEntry } from "~/types";

type ResolveList = ResolverFactory;

// TODO: fix types.
export const resolveList: ResolveList =
    ({ model }) =>
    async (_: any, args, context) => {
        const normalizedArgs = structuredClone(args);

        if (normalizedArgs.where?.meta) {
            normalizedArgs.where = {
                ...normalizedArgs.where,
                ...normalizedArgs.where.meta
            };

            delete normalizedArgs.where!.meta;
        }

        if (Array.isArray(normalizedArgs.sort)) {
            normalizedArgs.sort = normalizedArgs.sort.map((item: string) => {
                if (item.startsWith("meta")) {
                    const fieldWithoutMeta = item.slice(4);
                    // Undo capitalise of the first letter of the field.
                    return fieldWithoutMeta[0].toLowerCase() + fieldWithoutMeta.slice(1);
                }
                return item;
            });
        }

        try {
            const response: [CmsEntry[], CmsEntryMeta] = await context.cms.listPublishedEntries(
                model,
                normalizedArgs
            );

            return new ListResponse(...response);
        } catch (e) {
            return new ListErrorResponse(e);
        }
    };
