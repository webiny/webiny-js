/**
 * This function was created to easily compare element types.
 *
 * Comparing element types (classes) in Webiny is not very straightforward as we wrap our component classes with another class
 * called `ComponentWrapper` but in your code we do not want you to worry about existence of that wrapper.
 *
 * It is also important to mention that `react-hot-loader` creates its own wrapper around components so comparison is different in production and in development.
 *
 *
 * Usage:
 * Webiny.isElementOfType(element, componentClassToCompareWith)
 */
import React from 'react';
import _ from 'lodash';

export default (element, type) => {
    if (!element || !React.isValidElement(element) || _.isString(element.type)) {
        return false;
    }

    // If a class to compare against has an "__originalComponent" property it means it's a ComponentWrapper
    // Need to compare against originalComponent class
    let targetType = type;
    if (type.hasOwnProperty('__originalComponent')) {
        targetType = type.__originalComponent;
    }

    // If the element type has an "__originalComponent" property it means it's a ComponentWrapper
    // Need to compare against originalComponent class
    let elementType = element.type;
    if (elementType.hasOwnProperty('__originalComponent')) {
        elementType = elementType.__originalComponent;
    }

    // Check if targetType can be found in the inheritance tree with possible ComponentWrapper being an intermediate class
    const checkDeeper = (elementType) => {
        if (!elementType) {
            return false;
        }

        if (elementType === targetType || elementType.prototype instanceof targetType) {
            return true;
        }

        return checkDeeper(Object.getPrototypeOf(elementType.prototype).constructor.__originalComponent);
    };

    if (elementType === targetType || elementType.prototype instanceof targetType) {
        return true;
    }

    try {
        return checkDeeper(Object.getPrototypeOf(elementType.prototype).constructor.__originalComponent);
    } catch (e) {
        return false;
    }
};