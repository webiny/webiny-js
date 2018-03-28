"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = entity => {
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
//# sourceMappingURL=nameSlugDesc.js.map
