// @flow
import { Response, ErrorResponse } from "webiny-api/graphql/responses";
import { type IGeneralSettings } from "./../../../entities/GeneralSettings.entity";

type EntityFetcher = (context: Object) => IGeneralSettings;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const generalSettingsClass = entityFetcher(context);

    const settings = await generalSettingsClass.load();
    if (!settings) {
        return new ErrorResponse({
            code: "NOT_FOUND",
            message: "Settings not found."
        });
    }

    return new Response(settings.data);
};
