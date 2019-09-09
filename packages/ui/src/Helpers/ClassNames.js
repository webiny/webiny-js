import classnames from "classnames";
import { clone } from "lodash";

/**
 * This is a pass-through that modifies your object's props and creates the required className prop by merging
 * the provided appendClasses(string) and any class names defined inside your props.
 * To you the function just do: {...getClasses (props)}
 * and make sure you are not spreading the `props` element, as this will clone and spread your current `props` element already.
 * @param {*} propList
 * @param {*} appendClasses
 */

const getClasses = (propList, appendClasses) => {
    let classes = {};
    let props = clone(propList);
    if (propList.hasOwnProperty("className")) {
        classes = classnames(propList.className);
        delete props.className;
    }

    if (typeof appendClasses !== "undefined") {
        classes = classnames(classes, appendClasses);
    }

    props.className = classes;

    return props;
};

export { getClasses };
