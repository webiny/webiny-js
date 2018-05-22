"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _webinyApp = require("webiny-app");

var _paragraph = require("./widgets/pageEditor/paragraph");

var _paragraph2 = _interopRequireDefault(_paragraph);

var _image = require("./widgets/pageEditor/image");

var _image2 = _interopRequireDefault(_image);

var _row = require("./widgets/layoutEditor/row");

var _row2 = _interopRequireDefault(_row);

var _index = require("./../widgets/paragraph/index");

var _index2 = _interopRequireDefault(_index);

var _index3 = require("./../widgets/image/index");

var _index4 = _interopRequireDefault(_index3);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function() {
    var cmsService = _webinyApp.app.services.get("cms");

    cmsService.addWidgetGroup({
        name: "text",
        title: "Text",
        icon: "font"
    });

    cmsService.addWidgetGroup({
        name: "media",
        title: "Media",
        icon: "image"
    });

    cmsService.addWidgetGroup({
        name: "global",
        title: "Global",
        icon: "globe"
    });

    // Editor widgets
    cmsService.addEditorWidget({
        group: "text",
        type: "paragraph",
        title: "Paragraph",
        icon: ["fas", "align-left"],
        widget: new _paragraph2.default()
    });

    cmsService.addEditorWidget({
        group: "media",
        type: "image",
        title: "Image",
        icon: ["fas", "image"],
        widget: new _image2.default()
    });

    // Preview widgets
    cmsService.addWidget({
        type: "paragraph",
        widget: new _index2.default()
    });

    cmsService.addWidget({
        type: "image",
        widget: new _index4.default()
    });

    // Layout editor widgets
    cmsService.addLayoutEditorWidget({
        type: "grid-12",
        widget: new _row2.default({ layout: [12], title: "Full Width" }),
        data: [{ grid: 12, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-6-6",
        widget: new _row2.default({ layout: [6, 6], title: "Half Half" }),
        data: [{ grid: 6, widget: null }, { grid: 6, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-3-3-6",
        widget: new _row2.default({ layout: [3, 3, 6], title: "One Two" }),
        data: [{ grid: 3, widget: null }, { grid: 3, widget: null }, { grid: 6, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-6-3-3",
        widget: new _row2.default({ layout: [6, 3, 3], title: "Two One" }),
        data: [{ grid: 6, widget: null }, { grid: 3, widget: null }, { grid: 3, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-3-9",
        widget: new _row2.default({ layout: [3, 9], title: "One Three" }),
        data: [{ grid: 3, widget: null }, { grid: 9, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-9-3",
        widget: new _row2.default({ layout: [9, 3], title: "Three One" }),
        data: [{ grid: 9, widget: null }, { grid: 3, widget: null }]
    });

    cmsService.addLayoutEditorWidget({
        type: "grid-3-3-3-3",
        widget: new _row2.default({ layout: [3, 3, 3, 3], title: "Full Split" }),
        data: [
            { grid: 3, widget: null },
            { grid: 3, widget: null },
            { grid: 3, widget: null },
            { grid: 3, widget: null }
        ]
    });

    // Global widgets
    var loadWidgets = _webinyApp.app.graphql.generateList(
        "CmsWidget",
        "id title type data settings"
    );

    return loadWidgets({ variables: { perPage: 1000 } }).then(function(_ref) {
        var data = _ref.data;

        data.list.map(function(widget) {
            var baseWidget = (0, _cloneDeep3.default)(cmsService.getEditorWidget(widget.type));
            var globalWidget = Object.assign(
                {
                    origin: widget.id
                },
                baseWidget,
                (0, _pick3.default)(widget, ["title", "data", "settings"]),
                {
                    group: "global"
                }
            );

            cmsService.addEditorWidget(globalWidget);
        });
    });
};
//# sourceMappingURL=registerWidgets.js.map
