import { RecoilRootProps } from "recoil";
import {
    elementsAtom,
    pageAtom,
    PageAtomType,
    PageWithContent,
    revisionsAtom,
    RevisionsAtomType,
    rootElementAtom
} from "~/editor/recoil/modules";
import { flattenElements } from "~/editor/helpers";
import omit from "lodash/omit";

export const createStateInitializer = (
    page: PageWithContent | null,
    revisions: RevisionsAtomType
): RecoilRootProps["initializeState"] => {
    if (!page) {
        return () => void 0;
    }

    return ({ set }) => {
        /* Here we initialize elementsAtom and rootElement if it exists */
        set(rootElementAtom, page!.content?.id || "");

        const elements = flattenElements(page!.content);
        Object.keys(elements).forEach(key => {
            set(elementsAtom(key), elements[key]);
        });
        /**
         * We always unset the content because we are not using it via the page atom.
         */
        const pageData: PageAtomType = omit(page, ["content"]);

        set(pageAtom, pageData);
        set(revisionsAtom, revisions);
    };
};
