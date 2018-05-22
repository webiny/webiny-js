"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        [
            "\n            query LoadPage($url: String!) {\n                loadPageByUrl(url: $url) {\n                    id\n                    title\n                    slug\n                    content\n                }\n            }\n        "
        ],
        [
            "\n            query LoadPage($url: String!) {\n                loadPageByUrl(url: $url) {\n                    id\n                    title\n                    slug\n                    content\n                }\n            }\n        "
        ]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        [
            "\n            query LoadPageRevision($id: String!) {\n                loadPageRevision(id: $id) {\n                    id\n                    title\n                    slug\n                    content\n                }\n            }\n        "
        ],
        [
            "\n            query LoadPageRevision($id: String!) {\n                loadPageRevision(id: $id) {\n                    id\n                    title\n                    slug\n                    content\n                }\n            }\n        "
        ]
    );

var _webinyApp = require("webiny-app");

var _graphqlTag = require("graphql-tag");

var _graphqlTag2 = _interopRequireDefault(_graphqlTag);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = {
    loadPage: function loadPage(url) {
        var query = (0, _graphqlTag2.default)(_templateObject);

        return _webinyApp.app.graphql
            .query({ query: query, variables: { url: url } })
            .then(function(_ref) {
                var data = _ref.data;

                return data.loadPageByUrl;
            });
    },

    loadPageRevision: function loadPageRevision(id) {
        var query = (0, _graphqlTag2.default)(_templateObject2);

        return _webinyApp.app.graphql
            .query({ query: query, variables: { id: id } })
            .then(function(_ref2) {
                var data = _ref2.data;

                return data.loadPageRevision;
            });
    }
};
//# sourceMappingURL=api.js.map
