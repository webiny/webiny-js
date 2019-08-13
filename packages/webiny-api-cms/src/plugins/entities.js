// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-cms/entities";

const category: EntityPluginType = {
    name: "entity-cms-category",
    type: "entity",
    entity: entities.categoryFactory
};

const element: EntityPluginType = {
    name: "entity-cms-element",
    type: "entity",
    entity: entities.elementFactory
};

const menu: EntityPluginType = {
    name: "entity-cms-menu",
    type: "entity",
    entity: entities.menuFactory
};

const page: EntityPluginType = {
    name: "entity-cms-page",
    type: "entity",
    entity: entities.pageFactory
};

const settings: EntityPluginType = {
    name: "entity-cms-settings",
    type: "entity",
    entity: entities.cmsSettingsFactory
};

export default [category, element, menu, page, settings];
