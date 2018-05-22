"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    ["{created|dateTime}"],
    ["{created|dateTime}"]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _PageList = require("./PageList.scss?prefix=PageList");

var _PageList2 = _interopRequireDefault(_PageList);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Cms.Admin.Views.PageList");

var PageList = function PageList(_ref) {
    var pages = _ref.pages,
        onPageClick = _ref.onPageClick;

    return _react2.default.createElement(
        "ul",
        { className: _PageList2.default.list },
        pages.map(function(page) {
            var key = page.id + "-" + page.savedOn;
            return _react2.default.createElement(
                "li",
                {
                    className: _PageList2.default.item,
                    key: key,
                    onClick: function onClick() {
                        return onPageClick(page);
                    }
                },
                _react2.default.createElement(
                    "div",
                    { className: _PageList2.default.header },
                    _react2.default.createElement(
                        "div",
                        null,
                        t(_templateObject)({
                            created: page.createdOn
                        })
                    ),
                    _react2.default.createElement("div", null, page.category.title),
                    _react2.default.createElement(
                        "div",
                        null,
                        "By: ",
                        page.createdBy.firstName,
                        " ",
                        page.createdBy.lastName
                    )
                ),
                _react2.default.createElement(
                    "div",
                    { className: _PageList2.default.body },
                    _react2.default.createElement(
                        "div",
                        { className: _PageList2.default.title },
                        page.title
                    )
                )
            );
        })
    );
};

exports.default = PageList;
//# sourceMappingURL=PageList.js.map
