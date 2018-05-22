"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _findIndex2 = require("lodash/findIndex");

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var CMS = (function() {
    /**
     * @private
     */

    /**
     * @private
     */
    function CMS() {
        (0, _classCallCheck3.default)(this, CMS);

        this.widgets = [];
        this.widgetGroups = [];
        this.editorWidgets = [];
        this.layoutEditorWidgets = [];
    }

    /**
     * @private
     */

    /**
     * @private
     */

    (0, _createClass3.default)(CMS, [
        {
            key: "addWidgetGroup",
            value: function addWidgetGroup(group) {
                this.widgetGroups.push(group);
            }
        },
        {
            key: "addEditorWidget",
            value: function addEditorWidget(widget) {
                this.editorWidgets.push(widget);
            }
        },
        {
            key: "addLayoutEditorWidget",
            value: function addLayoutEditorWidget(widget) {
                this.layoutEditorWidgets.push(widget);
            }
        },
        {
            key: "addWidget",
            value: function addWidget(widget) {
                this.widgets.push(widget);
            }
        },
        {
            key: "getWidget",
            value: function getWidget(type) {
                return (0, _find3.default)(this.widgets, { type: type });
            }
        },
        {
            key: "getWidgetGroups",
            value: function getWidgetGroups() {
                return this.widgetGroups;
            }
        },
        {
            key: "getEditorWidgets",
            value: function getEditorWidgets(group) {
                return group
                    ? this.editorWidgets.filter(function(w) {
                          return w.group === group;
                      })
                    : this.editorWidgets;
            }
        },
        {
            key: "getEditorWidget",
            value: function getEditorWidget(type) {
                var extraFilters =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                return (0, _find3.default)(
                    this.editorWidgets,
                    Object.assign({ type: type }, extraFilters)
                );
            }
        },
        {
            key: "getLayoutEditorWidgets",
            value: function getLayoutEditorWidgets() {
                return this.layoutEditorWidgets;
            }
        },
        {
            key: "getLayoutEditorWidget",
            value: function getLayoutEditorWidget(type) {
                var filter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                return (0, _find3.default)(
                    this.layoutEditorWidgets,
                    Object.assign({ type: type }, filter)
                );
            }
        },
        {
            key: "createGlobalWidget",
            value: function createGlobalWidget(data) {
                var _this = this;

                var createWidget = _webinyApp.app.graphql.generateCreate("CmsWidget", "id");
                return createWidget({ variables: { data: data } }).then(function(_ref) {
                    var id = _ref.data.id;

                    // Register new global widget
                    var widgetDefinition = _this.getEditorWidget(data.type);
                    _this.addEditorWidget(
                        Object.assign(
                            {
                                type: "global"
                            },
                            (0, _cloneDeep3.default)(widgetDefinition),
                            data,
                            {
                                origin: id
                            }
                        )
                    );

                    return id;
                });
            }
        },
        {
            key: "updateGlobalWidget",
            value: function updateGlobalWidget(id, data) {
                var _this2 = this;

                var updateWidget = _webinyApp.app.graphql.generateUpdate("CmsWidget", "id");
                return updateWidget({ variables: { id: id, data: data } }).then(function() {
                    // Register new global widget
                    var index = (0, _findIndex3.default)(_this2.editorWidgets, {
                        group: "global",
                        origin: id
                    });
                    _this2.editorWidgets[index] = Object.assign(
                        {},
                        _this2.editorWidgets[index],
                        data
                    );
                });
            }
        },
        {
            key: "deleteGlobalWidget",
            value: function deleteGlobalWidget(id) {
                var _this3 = this;

                var deleteWidget = _webinyApp.app.graphql.generateDelete("CmsWidget", "id");
                return deleteWidget({ variables: { id: id } }).then(function() {
                    var index = (0, _findIndex3.default)(_this3.editorWidgets, {
                        group: "global",
                        origin: id
                    });
                    _this3.editorWidgets.splice(index, 1);
                });
            }
        }
    ]);
    return CMS;
})();

exports.default = CMS;
//# sourceMappingURL=CMS.js.map
