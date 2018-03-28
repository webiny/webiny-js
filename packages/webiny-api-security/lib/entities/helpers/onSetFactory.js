"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyEntity = require("webiny-entity");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = EntityClass => {
    return (() => {
        var _ref = (0, _asyncToGenerator3.default)(function*(entities) {
            if (Array.isArray(entities)) {
                for (let i = 0; i < entities.length; i++) {
                    let value = entities[i];
                    if (value instanceof EntityClass) {
                        continue;
                    }
                    let query = { id: value };
                    // If not DB ids - load entities by slugs
                    if (!EntityClass.isId(value)) {
                        if (typeof value === "string") {
                            query = { slug: value };
                        } else if (value.id) {
                            query = { id: value.id };
                        } else if (value.slug) {
                            query = { slug: value.slug };
                        }
                    }

                    // TODO: ne bi htio loadati entitet tu jer to je samo populate
                    entities[i] = yield EntityClass.findOne({ query });
                }

                return new _webinyEntity.EntityCollection(entities.filter(Boolean));
            }

            return entities;
        });

        return function(_x) {
            return _ref.apply(this, arguments);
        };
    })();
}; /**
 * Create onSet callback for the specified Entity class.
 * The callback is used on `entities` attributes for Role, RoleGroup and Permission entities
 * to handle different types of data: id, slug, {id}, {slug}.
 *
 * @param EntityClass
 * @returns {function(*=)}
 */
//# sourceMappingURL=onSetFactory.js.map
