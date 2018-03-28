"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _webinyModel = require("webiny-model");

var _webinyEntity = require("webiny-entity");

var _endpoint = require("./endpoint");

var _endpoint2 = _interopRequireDefault(_endpoint);

var _requestUtils = require("./../etc/requestUtils");

var _requestUtils2 = _interopRequireDefault(_requestUtils);

var _apiContainer = require("./apiContainer");

var _apiContainer2 = _interopRequireDefault(_apiContainer);

var _apiResponse = require("./../response/apiResponse");

var _apiResponse2 = _interopRequireDefault(_apiResponse);

var _apiErrorResponse = require("../response/apiErrorResponse");

var _apiErrorResponse2 = _interopRequireDefault(_apiErrorResponse);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class EntityEndpoint extends _endpoint2.default {
    getEntityClass() {
        throw new Error(`"getEntityClass" method not implemented in ${this.constructor.classId}`);
    }

    /**
     * Create default CRUD methods for given entity
     * @param {ApiContainer} api
     */
    init(api) {
        var _this = this;

        super.init(api);
        const classId = this.constructor.classId;
        const EntityClass = this.getEntityClass();
        const entityClassId = EntityClass.classId;

        const createNotFoundResponse = id => {
            return new _apiErrorResponse2.default(
                { id },
                `${entityClassId} with id ${id} was not found!`,
                "WBY_ENTITY_NOT_FOUND"
            );
        };

        const createValidationErrorResponse = e => {
            return new _apiErrorResponse2.default(
                e.data,
                `${entityClassId} validation failed!`,
                e.code
            );
        };

        // CRUD List
        api.get(
            `List.${classId}`,
            "/",
            (() => {
                var _ref = (0, _asyncToGenerator3.default)(function*({ req }) {
                    const utils = (0, _requestUtils2.default)(req);
                    const params = {
                        page: utils.getPage(),
                        perPage: utils.getPerPage(10),
                        order: utils.getSorters(),
                        query: utils.getFilters(),
                        search: utils.getSearch()
                    };
                    const data = yield _this.getEntityClass().find(params);
                    const response = yield _this.formatList(
                        data,
                        (0, _requestUtils2.default)(req).getFields()
                    );
                    return new _apiResponse2.default(response);
                });

                return function(_x) {
                    return _ref.apply(this, arguments);
                };
            })()
        );

        // CRUD Get
        api.get(
            `Get.${classId}`,
            "/:id",
            (() => {
                var _ref2 = (0, _asyncToGenerator3.default)(function*({ req, id }) {
                    const entity = yield EntityClass.findById(id);
                    if (!entity) {
                        return createNotFoundResponse(id);
                    }
                    const response = yield _this.formatEntity(
                        entity,
                        (0, _requestUtils2.default)(req).getFields()
                    );
                    return new _apiResponse2.default(response);
                });

                return function(_x2) {
                    return _ref2.apply(this, arguments);
                };
            })()
        );

        // CRUD Create
        api.post(
            `Create.${classId}`,
            "/",
            (() => {
                var _ref3 = (0, _asyncToGenerator3.default)(function*({ req }) {
                    const entity = new EntityClass();
                    try {
                        yield entity.populate(req.body).save();
                    } catch (e) {
                        return createValidationErrorResponse(e);
                    }
                    const response = yield _this.formatEntity(
                        entity,
                        (0, _requestUtils2.default)(req).getFields()
                    );
                    return new _apiResponse2.default(response);
                });

                return function(_x3) {
                    return _ref3.apply(this, arguments);
                };
            })()
        );

        // CRUD Update
        api.patch(
            `Update.${classId}`,
            "/:id",
            (() => {
                var _ref4 = (0, _asyncToGenerator3.default)(function*({ req, id }) {
                    const entity = yield EntityClass.findById(id);
                    if (!entity) {
                        return createNotFoundResponse(id);
                    }
                    try {
                        yield entity.populate(req.body).save();
                    } catch (e) {
                        return createValidationErrorResponse(e);
                    }
                    const response = yield _this.formatEntity(
                        entity,
                        (0, _requestUtils2.default)(req).getFields()
                    );
                    return new _apiResponse2.default(response);
                });

                return function(_x4) {
                    return _ref4.apply(this, arguments);
                };
            })()
        );

        // CRUD Delete
        api.delete(
            `Delete.${classId}`,
            "/:id",
            (() => {
                var _ref5 = (0, _asyncToGenerator3.default)(function*({ id }) {
                    const entity = yield EntityClass.findById(id);
                    if (!entity) {
                        return createNotFoundResponse(id);
                    }
                    yield entity.delete();
                    return new _apiResponse2.default(true);
                });

                return function(_x5) {
                    return _ref5.apply(this, arguments);
                };
            })()
        );
    }

    formatEntity(entity, fields) {
        return (0, _asyncToGenerator3.default)(function*() {
            const data = yield entity.toJSON(fields);
            const meta = { fields };
            return { entity: data, meta };
        })();
    }

    formatList(entityCollection, fields) {
        return (0, _asyncToGenerator3.default)(function*() {
            const list = yield entityCollection.toJSON(fields);
            const meta = entityCollection.getParams();
            meta.count = entityCollection.length;
            meta.totalCount = entityCollection.getMeta().totalCount;
            meta.totalPages = Math.ceil(meta.totalCount / meta.perPage);
            return { list, meta };
        })();
    }
}
exports.default = EntityEndpoint;
//# sourceMappingURL=entityEndpoint.js.map
