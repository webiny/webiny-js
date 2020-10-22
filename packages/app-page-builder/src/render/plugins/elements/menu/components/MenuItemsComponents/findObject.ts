import { findIndex, each } from "lodash";

/**
 * Recursively search for an object with given ID in the given source array.
 */
const findObject = (source: Array<any>, id: string): any => {
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
    });

    return res;
};

export default findObject;
