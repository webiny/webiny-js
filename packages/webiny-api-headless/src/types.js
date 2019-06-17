import type { PluginType } from "webiny-plugins/types";
import type { Entity } from "webiny-entity";

export type HeadlessFieldTypePlugin = PluginType & {
    fieldType: string,
    createAttribute: ({ model: Object, field: Object, entity: Entity, context: Object }) => void
};
