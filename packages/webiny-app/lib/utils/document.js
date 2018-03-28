"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var DocumentUtils = (function() {
    function DocumentUtils() {
        (0, _classCallCheck3.default)(this, DocumentUtils);
    }

    (0, _createClass3.default)(DocumentUtils, [
        {
            key: "loadScript",
            value: function loadScript(url) {
                return new Promise(function(resolve) {
                    // Is it already inserted, possibly with server-side rendering?
                    if (document.querySelectorAll('script[src="' + url + '"]').length > 0) {
                        return;
                    }
                    var s = document.createElement("script");
                    s.type = "text/javascript";
                    s.src = url;
                    s.async = true;
                    s.onload = resolve;
                    document.body.appendChild(s);
                });
            }
        },
        {
            key: "loadStylesheet",
            value: function loadStylesheet(url) {
                return new Promise(function(resolve) {
                    // Is it already inserted, possibly with server-side rendering?
                    if (
                        document.querySelectorAll('link[rel="stylesheet"][href="' + url + '"]')
                            .length > 0
                    ) {
                        return;
                    }

                    var s = document.createElement("link");
                    s.rel = "stylesheet";
                    s.href = url;
                    s.onload = resolve;
                    document.head.appendChild(s);
                });
            }
        },
        {
            key: "setMeta",
            value: function setMeta(attributes) {
                var updatedExisting = false;
                (0, _each3.default)(["name", "property"], function(name) {
                    if ((0, _has3.default)(attributes, name)) {
                        // Fetch existing element
                        var _element = document.querySelector(
                            "meta[" + name + '="' + attributes[name] + '"]'
                        );
                        if (_element) {
                            // If exists, update with new attributes
                            (0, _each3.default)(attributes, function(value, key) {
                                return _element.setAttribute(key, value);
                            });
                            updatedExisting = true;
                            return false;
                        }
                    }
                });

                if (updatedExisting) {
                    return;
                }

                // Create new element
                var element = document.createElement("meta");
                (0, _each3.default)(attributes, function(value, key) {
                    return element.setAttribute(key, value);
                });
                document.head.appendChild(element);
            }
        },
        {
            key: "setTitle",
            value: function setTitle(title) {
                document.title = title;
            }
        }
    ]);
    return DocumentUtils;
})();

exports.default = DocumentUtils;
//# sourceMappingURL=document.js.map
