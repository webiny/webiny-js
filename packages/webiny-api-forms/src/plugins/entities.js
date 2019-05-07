// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-forms/entities";

const category: EntityPluginType = {
    name: "entity-forms-category",
    type: "entity",
    namespace: "forms",
    entity: {
        name: "Category",
        factory: entities.categoryFactory
    }
};

const element: EntityPluginType = {
    name: "entity-forms-element",
    type: "entity",
    namespace: "forms",
    entity: {
        name: "Element",
        factory: entities.elementFactory
    }
};

const menu: EntityPluginType = {
    name: "entity-forms-menu",
    type: "entity",
    namespace: "forms",
    entity: {
        name: "Menu",
        factory: entities.menuFactory
    }
};

const form: EntityPluginType = {
    name: "entity-forms-form",
    type: "entity",
    namespace: "forms",
    entity: {
        name: "Form",
        factory: entities.formFactory
    }
};

export default [category, element, menu, form];
