import omit from "lodash/omit";
import {
    pageAtom,
    PageAtomType,
    PageWithContent,
    revisionsAtom,
    RevisionsAtomType
} from "~/pageEditor/state";
import { EditorStateInitializerFactory } from "~/editor";

export const createStateInitializer = (
    page: PageWithContent,
    revisions: RevisionsAtomType
): EditorStateInitializerFactory => {
    return () => ({
        content: page.content,
        recoilInitializer({ set }) {
            /**
             * We always unset the content because we are not using it via the page atom.
             */
            const pageData: PageAtomType = omit(page, ["content"]);

            set(pageAtom, pageData);
            set(revisionsAtom, revisions);
        }
    });
};
