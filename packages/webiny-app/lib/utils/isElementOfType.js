"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function(element, type) {
    if (
        !element ||
        !_react2.default.isValidElement(element) ||
        (0, _isString3.default)(element.type)
    ) {
        return false;
    }

    // If a class to compare against has an "__originalComponent" property it means it's a ComponentWrapper
    // Need to compare against originalComponent class
    var targetType = type;
    if (type.hasOwnProperty("__originalComponent")) {
        targetType = type.__originalComponent;
    }

    // If the element type has an "__originalComponent" property it means it's a ComponentWrapper
    // Need to compare against originalComponent class
    var elementType = element.type;
    if (elementType.hasOwnProperty("__originalComponent")) {
        elementType = elementType.__originalComponent;
    }

    // Check if targetType can be found in the inheritance tree with possible ComponentWrapper being an intermediate class
    var checkDeeper = function checkDeeper(elementType) {
        if (!elementType) {
            return false;
        }

        if (elementType === targetType || elementType.prototype instanceof targetType) {
            return true;
        }

        return checkDeeper(
            Object.getPrototypeOf(elementType.prototype).constructor.__originalComponent
        );
    };

    if (elementType === targetType || elementType.prototype instanceof targetType) {
        return true;
    }

    try {
        return checkDeeper(
            Object.getPrototypeOf(elementType.prototype).constructor.__originalComponent
        );
    } catch (e) {
        return false;
    }
}; /**
 * Compare element types.
 *
 * Comparing element types (classes) in Webiny is not very straightforward as we wrap our component classes with another class
 * called `ComponentWrapper` but in your code we do not want you to worry about existence of that wrapper.
 *
 * It is also important to mention that `react-hot-loader` creates its own wrapper around components so comparison is different in production and in development.
 *
 *
 * Usage:
 * isElementOfType(element, componentClassToCompareWith)
 */
//# sourceMappingURL=isElementOfType.js.map
