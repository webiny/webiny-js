"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.defaultWidgetRenderMiddleware = exports.defaultWidgetRender = undefined;

var _invariant = require("invariant");

var _invariant2 = _interopRequireDefault(_invariant);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Default logic for single widget rendering.
 */
var defaultWidgetRender = (exports.defaultWidgetRender = function defaultWidgetRender(_ref) {
    var widget = _ref.widget;

    var cms = _webinyApp.app.services.get("cms");

    var widgetDefinition = cms.getWidget(widget.type);
    (0, _invariant2.default)(
        widgetDefinition,
        'Missing widget definition for type "' + widget.type + '"'
    );

    return React.cloneElement(widgetDefinition.render(widget), { value: widget });
});

/**
 * Default middleware for rendering of page widgets.
 * It will not render anything if there already is an output assigned by previous middleware.
 */
var defaultWidgetRenderMiddleware = (exports.defaultWidgetRenderMiddleware = function defaultWidgetRenderMiddleware(
    params,
    next
) {
    if (params.output) {
        return next();
    }
    params.output = defaultWidgetRender(params);
    next();
});
//# sourceMappingURL=widgetRender.js.map
