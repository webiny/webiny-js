import { PbElement } from "~/types";

export const getChildrenPaths = (elements: PbElement[] = []) => {
    const paths: string[] = [];

    const findDeep = (elements: PbElement[]) => {
        for (const element of elements) {
            if (element.data?.dynamicSource?.path) {
                paths.push(element.data.dynamicSource.path);
            } else if (Array.isArray(element.elements)) {
                findDeep(element.elements);
            }
        }
    };

    findDeep(elements);
    return [...new Set(paths)];
};
