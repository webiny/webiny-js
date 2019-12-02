// @flow
import { ErrorResponse, Response } from "@webiny/api";

export default async (_: Object, args: Object, context) => {
    try {
        const { path } = args;
        const { PbPageCache } = context.models;

        let pbPageCache = await PbPageCache.findByPath(path);
        if (!pbPageCache) {
            pbPageCache = new PbPageCache();
            pbPageCache.path = path;
            await pbPageCache.save();
        }

        if (pbPageCache.hasExpired) {
            await pbPageCache.refresh();
            await pbPageCache.save();
        }

        return new Response(pbPageCache);
    } catch (e) {
        await console.log(e.stack);
        return new ErrorResponse({
            code: "PB_PAGE_SSR_ERROR",
            message: e.message
        });
    }
};
