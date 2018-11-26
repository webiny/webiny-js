// @flow
import type { Entity } from "webiny-entity";
import { Response, ErrorResponse } from "webiny-api/graphql/responses";

type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    { data }: Object,
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

    settings.data = data;
    await settings.save();
    return new Response(settings.data);
};
