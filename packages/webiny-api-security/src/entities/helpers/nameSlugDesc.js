// @flow
import type { Entity } from "webiny-api";

export default (entity: Entity) => {
    entity
        .attr("name")
        .char()
        .setValidators("required");
    entity
        .attr("slug")
        .char()
        .setValidators("required");
    entity
        .attr("description")
        .char()
        .setValidators("required");
};
