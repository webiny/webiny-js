// @flow
import type { Entity, Schema } from "./../../../types";
import convertModelToType from "./convertModelToType";

export default (entityClass: Class<Entity>, schema: Schema) => {
    // Instantiate to get attribute definitions
    const entity = new entityClass();

    // Run model to type conversion.
    // We do not pass an entire entity because this same function is used for conversion of Models,
    // this way we can reuse the function in different contexts.
    return convertModelToType(
        entityClass.classId,
        { type: "entity" },
        entity.getAttributes(),
        schema
    );
};
