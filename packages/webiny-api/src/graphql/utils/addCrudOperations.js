import addCreate from "./crud/create";
import addUpdate from "./crud/update";
import addDelete from "./crud/delete";
import addGet from "./crud/get";
import addList from "./crud/list";

export default (entityClass, schema) => {
    addCreate(entityClass, schema);
    addUpdate(entityClass, schema);
    addDelete(entityClass, schema);
    addGet(entityClass, schema);
    addList(entityClass, schema);
};
