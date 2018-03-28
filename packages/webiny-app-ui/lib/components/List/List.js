"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _ApiContainer = require("./Components/ApiContainer");

var _ApiContainer2 = _interopRequireDefault(_ApiContainer);

var _StaticContainer = require("./Components/StaticContainer");

var _StaticContainer2 = _interopRequireDefault(_StaticContainer);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var List = function List(props) {
    return props.api
        ? _react2.default.createElement(_ApiContainer2.default, props)
        : _react2.default.createElement(_StaticContainer2.default, props);
};

exports.default = List;
//# sourceMappingURL=List.js.map
