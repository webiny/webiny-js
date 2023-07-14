import classnames from "classnames";
import clone from "lodash/clone";

/**
 * This is a pass-through that modifies your object's props and creates the required className prop by merging
 * the provided appendClasses(string) and any class names defined inside your props.
 * To you the function just do: {...getClasses (props)}
 * and make sure you are not spreading the `props` element, as this will clone and spread your current `props` element already.
 */
/**
 * TODO @ts-refactor figure out propList type
 */
const getClasses = (propList: any, appendClasses: string[] | string) => {
    let classes = "";
    const props = clone(propList);
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
