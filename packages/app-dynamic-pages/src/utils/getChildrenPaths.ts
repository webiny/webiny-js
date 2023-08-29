import { PbElement } from "~/types";

const findDeep = (elements: PbElement[], paths: string[]) => {
    for (const element of elements) {
        if (element.data?.dynamicSource?.path) {
            paths.push(element.data.dynamicSource.path);
        } else if (Array.isArray(element.elements)) {
            findDeep(element.elements, paths);
        }
    }
};

export const getChildrenPaths = (elements: PbElement[] = []) => {
    const paths: string[] = [];
    findDeep(elements, paths);

    return [...new Set(paths)];
};
