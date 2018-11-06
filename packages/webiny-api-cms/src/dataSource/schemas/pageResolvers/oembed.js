import { fetchEmbed, findProvider } from "./oembed/index";
import { ErrorResponse, Response } from "webiny-api/graphql";

export default async (_, args) => {
    try {
        const provider = findProvider(args.url);
        if (!provider) {
            return new ErrorResponse({
                code: "OEMBED_PROVIDER_NOT_FOUND",
                message: "OEmbed provider for the requested URL was not found."
            });
        }

        return new Response(await fetchEmbed(args, provider));
    } catch (e) {
        console.log(e);
        return new ErrorResponse({
            code: "OEMBED_ERROR",
            message: e.message
        });
    }
};
