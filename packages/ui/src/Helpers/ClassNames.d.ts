/**
 * This is a pass-through that modifies your object's props and creates the required className prop by merging
 * the provided appendClasses(string) and any class names defined inside your props.
 * To you the function just do: {...getClasses (props)}
 * and make sure you are not spreading the `props` element, as this will clone and spread your current `props` element already.
 * @param {*} propList
 * @param {*} appendClasses
 */
declare const getClasses: (propList: any, appendClasses: any) => any;
export { getClasses };
