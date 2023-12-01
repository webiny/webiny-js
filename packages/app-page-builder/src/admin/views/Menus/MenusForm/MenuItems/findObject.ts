import findIndex from "lodash/findIndex";
import each from "lodash/each";
/**
 * Recursively search for an object with given ID in the given source array.
 *
 * TODO @ts-refactor
 * try to find some better types
 */
const findObject = (source: any[], id: string): any => {
    const index = findIndex(source, { id });
    if (index >= 0) {
        return { source, index, item: source[index] };
    }

    let res = null;
    each(source, s => {
        if (s.children) {
            const result = findObject(s.children, id);
            if (result) {
                res = result;
                return false;
            }
        }
        return true;
    });

    return res;
};

export default findObject;
