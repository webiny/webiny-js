// @flow
import { type EntityPluginType } from "webiny-api/types";
import * as entities from "webiny-api-cms/entities";

const category: EntityPluginType = {
    name: "entity-cms-category",
    type: "entity",
    namespace: "cms",
    entity: {
        name: "Category",
        factory: entities.categoryFactory
    }
};

const element: EntityPluginType = {
    name: "entity-cms-element",
    type: "entity",
    namespace: "cms",
    entity: {
        name: "Element",
        factory: entities.elementFactory
    }
};

const menu: EntityPluginType = {
    name: "entity-cms-menu",
    type: "entity",
    namespace: "cms",
    entity: {
        name: "Menu",
        factory: entities.menuFactory
    }
};

const page: EntityPluginType = {
    name: "entity-cms-page",
    type: "entity",
    namespace: "cms",
    entity: {
        name: "Page",
        factory: entities.pageFactory
    }
};

const tag: EntityPluginType = {
    name: "entity-cms-tag",
    type: "entity",
    namespace: "cms",
    entity: {
        name: "Tag",
        factory: entities.tagFactory
    }
};

const tags2Pages: EntityPluginType = {
    name: "entity-cms-tags-2-pages",
    type: "entity",
    namespace: "cms",
    entity: {
        name: "Tags2Pages",
        factory: entities.tags2PagesFactory
    }
};

export default [category, element, menu, page, tag, tags2Pages];
