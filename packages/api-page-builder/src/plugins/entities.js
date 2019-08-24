// @flow
import { type EntityPluginType } from "@webiny/api/types";
import * as entities from "@webiny/api-page-builder/entities";

const category: EntityPluginType = {
    name: "entity-pb-category",
    type: "entity",
    entity: entities.categoryFactory
};

const element: EntityPluginType = {
    name: "entity-pb-element",
    type: "entity",
    entity: entities.elementFactory
};

const menu: EntityPluginType = {
    name: "entity-pb-menu",
    type: "entity",
    entity: entities.menuFactory
};

const page: EntityPluginType = {
    name: "entity-pb-page",
    type: "entity",
    entity: entities.pageFactory
};

const settings: EntityPluginType = {
    name: "entity-pb-settings",
    type: "entity",
    entity: entities.pageBuilderSettingsFactory
};

export default [category, element, menu, page, settings];
