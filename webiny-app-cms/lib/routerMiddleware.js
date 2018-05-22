"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    [
        "\n            query LoadPage($url: String!) {\n                loadPageByUrl(url: $url) {\n                    id\n                    title\n                    slug\n                    content {\n                        type\n                        data\n                    }\n                }\n            }\n        "
    ],
    [
        "\n            query LoadPage($url: String!) {\n                loadPageByUrl(url: $url) {\n                    id\n                    title\n                    slug\n                    content {\n                        type\n                        data\n                    }\n                }\n            }\n        "
    ]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _graphqlTag = require("graphql-tag");

var _graphqlTag2 = _interopRequireDefault(_graphqlTag);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function() {
    var loadPage = function loadPage(url) {
        var query = (0, _graphqlTag2.default)(_templateObject);

        return _webinyApp.app.graphql
            .query({ query: query, variables: { url: url } })
            .then(function(_ref) {
                var data = _ref.data;

                return data.loadPageByUrl;
            });
    };

    return (function() {
        var _ref2 = (0, _asyncToGenerator3.default)(
            /*#__PURE__*/ _regenerator2.default.mark(function _callee(params, next, finish) {
                var route, match;
                return _regenerator2.default.wrap(
                    function _callee$(_context) {
                        while (1) {
                            switch ((_context.prev = _context.next)) {
                                case 0:
                                    // CMS middleware
                                    (route = params.route), (match = params.match);

                                    if (!(route.path === "*")) {
                                        _context.next = 3;
                                        break;
                                    }

                                    return _context.abrupt(
                                        "return",
                                        loadPage(match.url).then(function(data) {
                                            params.output = _react2.default.createElement(
                                                "div",
                                                null,
                                                _react2.default.createElement(
                                                    "h2",
                                                    null,
                                                    "CMS WILL RENDER...."
                                                ),
                                                _react2.default.createElement("p", null, match.url),
                                                _react2.default.createElement(
                                                    "pre",
                                                    null,
                                                    JSON.stringify(data, null, 2)
                                                )
                                            );
                                            finish(params);
                                        })
                                    );

                                case 3:
                                    next();

                                case 4:
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

        return function(_x, _x2, _x3) {
            return _ref2.apply(this, arguments);
        };
    })();
};
//# sourceMappingURL=routerMiddleware.js.map
