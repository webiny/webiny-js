// @flow
import { Response, ErrorResponse } from "webiny-api/graphql/responses";
import { type ICmsSettings } from "./../../../entities/CmsSettings.entity";

type EntityFetcher = (context: Object) => ICmsSettings;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const cmsSettingsClass = entityFetcher(context);

    const settings = await cmsSettingsClass.load();
    if (!settings) {
        return new ErrorResponse({
            code: "NOT_FOUND",
            message: "Settings not found."
        });
    }

    return new Response(settings.data);
};
