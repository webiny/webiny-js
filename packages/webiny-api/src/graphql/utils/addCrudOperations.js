// @flow
import addCreate from "./crud/create";
import addUpdate from "./crud/update";
import addDelete from "./crud/delete";
import addGet from "./crud/get";
import addList from "./crud/list";

import type { Entity } from "./../../entities";
import type Schema from "./../Schema";

export default (entityClass: Class<Entity>, schema: Schema) => {
    addCreate(entityClass, schema);
    addUpdate(entityClass, schema);
    addDelete(entityClass, schema);
    addGet(entityClass, schema);
    addList(entityClass, schema);
};
