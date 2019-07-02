// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-i18n/entities";

const i18nLocale: EntityPluginType = {
    name: "entity-i18n-locale",
    type: "entity",
    entity: entities.i18nLocaleFactory
};

export default [i18nLocale];
