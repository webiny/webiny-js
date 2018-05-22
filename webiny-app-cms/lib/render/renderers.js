"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createRenderer = undefined;

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _webinyCompose = require("webiny-compose");

var _webinyCompose2 = _interopRequireDefault(_webinyCompose);

var _webinyApp = require("webiny-app");

var _Page = require("./Page");

var _Page2 = _interopRequireDefault(_Page);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Default logic for single widget rendering.
 */
var defaultWidgetRender = function defaultWidgetRender(_ref) {
    var widget = _ref.widget;

    var cms = _webinyApp.app.services.get("cms");

    var widgetDefinition = cms.getWidget(widget.type);
    (0, _invariant2.default)(
        widgetDefinition,
        'Missing widget definition for type "' + widget.type + '"'
    );

    return _react2.default.cloneElement(widgetDefinition.render(widget), { value: widget });
};

/**
 * Default middleware for rendering of page widgets.
 * It will not render anything if there already is an output assigned by previous middleware.
 */
var defaultWidgetRenderMiddleware = function defaultWidgetRenderMiddleware(params, next) {
    if (params.output) {
        return next();
    }
    params.output = defaultWidgetRender(params);
    next();
};

/**
 * Page renderer factory
 * @param config
 * @returns {Function}
 */
var createRenderer = (exports.createRenderer = function createRenderer(config) {
    var widgetRender = config.widget || [];
    var widgetRenderMiddleware = (0, _webinyCompose2.default)(
        [].concat((0, _toConsumableArray3.default)(widgetRender), [defaultWidgetRenderMiddleware])
    );

    return (function() {
        var _ref2 = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee(data) {
                var content, i, widgetParams, output;
                return _regenerator2.default.wrap(
                    function _callee$(_context) {
                        while (1) {
                            switch ((_context.prev = _context.next)) {
                                case 0:
                                    content = [];
                                    i = 0;

                                case 2:
                                    if (!(i < data.content.length)) {
                                        _context.next = 11;
                                        break;
                                    }

                                    widgetParams = {
                                        page: data,
                                        widget: data.content[i],
                                        output: null,
                                        defaultWidgetRender: defaultWidgetRender
                                    };
                                    _context.next = 6;
                                    return widgetRenderMiddleware(widgetParams);

                                case 6:
                                    output = widgetParams.output;
                                    // $FlowIgnore

                                    content.push(
                                        _react2.default.cloneElement(output, {
                                            key: data.content[i].id
                                        })
                                    );

                                case 8:
                                    i++;
                                    _context.next = 2;
                                    break;

                                case 11:
                                    return _context.abrupt(
                                        "return",
                                        _react2.default.createElement(
                                            _Page2.default,
                                            { page: data },
                                            content
                                        )
                                    );

                                case 12:
                                case "end":
                                    return _context.stop();
                            }
                        }
                    },
                    _callee,
                    undefined
                );
            })
        );

        return function(_x) {
            return _ref2.apply(this, arguments);
        };
    })();
});
//# sourceMappingURL=renderers.js.map
