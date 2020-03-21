import { Response, NotFoundResponse, ErrorResponse } from "@webiny/api";
import { listPublishedPages } from "./listPublishedPages";
import get from "lodash.get";

const createNotFoundResponse = async ({ returnFallbackPage, context, page, message }) => {
    const response = new NotFoundResponse(message);
    if (returnFallbackPage === true) {
        const { PbSettings } = context.models;
        const settings = await PbSettings.load();
        const parent = get(settings, `data.pages.${page}`);
        if (!parent) {
            return response;
        }

        const [foundPage] = await listPublishedPages({ context, args: { parent, perPage: 1 } });
        response.data = foundPage;
    }

    return response;
};

export default async (root: any, args: { [key: string]: any }, context: { [key: string]: any }) => {
    const { PbSettings } = context.models;
    const settings = await PbSettings.load();
    if (!settings.data.installation.completed) {
        // We don't need to load the error page here, since PB is not installed at all, so it doesn't exist.
        return new ErrorResponse({
            code: "PB_NOT_INSTALLED",
            message: "Cannot get published pages, Page Builder is not installed."
        });
    }

    try {
        if (!args.parent && !args.url && !args.id) {
            throw new Error(`Please specify page "id", "parent" or "url".`);
        }

        if (args.url && args.url === "/") {
            const { PbSettings } = context.models;
            const settings = await PbSettings.load();
            const parent = get(settings, `data.pages.home`);

            const [page] = await listPublishedPages({ context, args: { parent, perPage: 1 } });
            if (page) {
                return new Response(page);
            }

            return createNotFoundResponse({
                returnFallbackPage: args.returnNotFoundPage,
                context,
                page: "notFound",
                message: "The requested page was not found."
            });
        }

        const [page] = await listPublishedPages({ context, args: { ...args, perPage: 1 } });
        if (page) {
            return new Response(page);
        }

        return createNotFoundResponse({
            returnFallbackPage: args.returnNotFoundPage,
            context,
            page: "notFound",
            message: "The requested page was not found."
        });
    } catch (e) {
        return createNotFoundResponse({
            returnFallbackPage: args.returnErrorPage,
            context,
            page: "error",
            message: e.message
        });
    }
};
