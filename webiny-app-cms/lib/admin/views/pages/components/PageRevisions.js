"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    ["{date|dateTime}"],
    ["{date|dateTime}"]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _CreateRevisionDialog = require("./CreateRevisionDialog");

var _CreateRevisionDialog2 = _interopRequireDefault(_CreateRevisionDialog);

var _PageDetailsContext = require("./../context/PageDetailsContext");

var _PageRevisions = require("./PageRevisions.scss?prefix=Webiny_CMS_PageRevisions");

var _PageRevisions2 = _interopRequireDefault(_PageRevisions);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Cms.Admin.Views.PageRevisions");

var RevisionActions = function RevisionActions(_ref) {
    var revision = _ref.revision,
        _ref$modules = _ref.modules,
        Icon = _ref$modules.Icon,
        Dropdown = _ref$modules.Dropdown;

    return _react2.default.createElement(_PageDetailsContext.PageDetailsConsumer, null, function(
        _ref2
    ) {
        var updateRevision = _ref2.updateRevision,
            reloadPage = _ref2.reloadPage,
            page = _ref2.page;
        return _react2.default.createElement(
            "div",
            { className: _PageRevisions2.default.actions },
            _react2.default.createElement(
                Dropdown,
                {
                    title: _react2.default.createElement(Icon, {
                        className: _PageRevisions2.default.cog,
                        icon: "cog"
                    }),
                    type: "balloon",
                    caret: false,
                    align: "right"
                },
                _react2.default.createElement(Dropdown.Header, { title: "Actions" }),
                !revision.active &&
                    _react2.default.createElement(Dropdown.Link, {
                        key: "activate",
                        title: "Activate",
                        onClick: function onClick() {
                            return updateRevision(revision.id, { active: true }).then(function() {
                                return reloadPage(page.id);
                            });
                        }
                    }),
                _react2.default.createElement(Dropdown.Link, {
                    key: "edit",
                    title: "Edit",
                    route: "Cms.Page.Editor",
                    params: { id: revision.id }
                }),
                _react2.default.createElement(Dropdown.Link, {
                    key: "create",
                    title: "Create new",
                    onClick: function onClick() {
                        _webinyApp.app.services
                            .get("modal")
                            .show("createRevision", { source: revision });
                    }
                })
            )
        );
    });
};

var ActiveRevision = function ActiveRevision(props) {
    var _props$revision = props.revision,
        name = _props$revision.name,
        title = _props$revision.title,
        createdOn = _props$revision.createdOn,
        savedOn = _props$revision.savedOn,
        createdBy = _props$revision.createdBy,
        Icon = props.modules.Icon;

    return _react2.default.createElement(
        "li",
        { className: _PageRevisions2.default.activeRevision },
        _react2.default.createElement(
            "span",
            { className: _PageRevisions2.default.badge },
            _react2.default.createElement(Icon, { icon: "check" }),
            " Active"
        ),
        _react2.default.createElement(
            "div",
            { className: _PageRevisions2.default.textWrap },
            _react2.default.createElement(
                "span",
                { className: _PageRevisions2.default.date },
                "Name: ",
                name
            ),
            _react2.default.createElement("h2", null, title),
            _react2.default.createElement(
                "span",
                { className: _PageRevisions2.default.date },
                "Created:",
                " ",
                t(_templateObject)({
                    date: createdOn
                })
            ),
            _react2.default.createElement(
                "span",
                { className: _PageRevisions2.default.date },
                "Last edited:",
                " ",
                t(_templateObject)({
                    date: savedOn
                })
            ),
            _react2.default.createElement(
                "span",
                { className: _PageRevisions2.default.date },
                "By: ",
                createdBy.firstName,
                " ",
                createdBy.lastName
            )
        ),
        _react2.default.createElement(RevisionActions, props)
    );
};

var Revision = function Revision(props) {
    var _props$revision2 = props.revision,
        id = _props$revision2.id,
        name = _props$revision2.name,
        title = _props$revision2.title,
        savedOn = _props$revision2.savedOn,
        createdBy = _props$revision2.createdBy;

    return _react2.default.createElement(
        "li",
        { className: _PageRevisions2.default.revision, key: id + "-" + savedOn },
        _react2.default.createElement(
            "div",
            { className: _PageRevisions2.default.textWrap },
            _react2.default.createElement(
                "span",
                { className: _PageRevisions2.default.revisionDate },
                "Name: ",
                name
            ),
            _react2.default.createElement("h3", null, title),
            _react2.default.createElement(
                "span",
                { className: _PageRevisions2.default.revisionDate },
                "Last edited:",
                " ",
                t(_templateObject)({
                    date: savedOn
                })
            ),
            _react2.default.createElement(
                "span",
                { className: _PageRevisions2.default.revisionDate },
                "By: ",
                createdBy.firstName,
                " ",
                createdBy.lastName
            )
        ),
        _react2.default.createElement(RevisionActions, props)
    );
};

var PageRevisions = function PageRevisions(_ref3) {
    var modules = _ref3.modules;

    return _react2.default.createElement(_PageDetailsContext.PageDetailsConsumer, null, function(
        _ref4
    ) {
        var page = _ref4.page;
        return _react2.default.createElement(
            _react.Fragment,
            null,
            _react2.default.createElement(_CreateRevisionDialog2.default, {
                page: page,
                name: "createRevision"
            }),
            _react2.default.createElement(
                "ul",
                { className: _PageRevisions2.default.revisions },
                _react2.default.createElement(ActiveRevision, {
                    modules: modules,
                    revision: (0, _find3.default)(page.revisions, { active: true })
                }),
                page.revisions
                    .filter(function(r) {
                        return !r.active;
                    })
                    .map(function(rev) {
                        return _react2.default.createElement(Revision, {
                            revision: rev,
                            key: rev.id + "-" + rev.savedOn,
                            modules: modules
                        });
                    })
            )
        );
    });
};

exports.default = PageRevisions;
//# sourceMappingURL=PageRevisions.js.map
