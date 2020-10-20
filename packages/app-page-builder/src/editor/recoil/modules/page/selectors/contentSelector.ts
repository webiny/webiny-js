import { connectedReadSelector } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import invariant from "invariant";
import { pageAtom } from "../pageAtom";
import { PbDocumentElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";

export const contentSelector = connectedReadSelector<PbElement>({
    key: "contentSelector",
    get: ({ get }) => {
        const page = get(pageAtom);
        if (page.content) {
            return page.content;
        }

        const document = plugins.byName<PbDocumentElementPlugin>("pb-editor-page-element-document");
        invariant(
            document,
            `"pb-editor-page-element-document" plugin must exist for Page Builder to work!`
        );
        return document.create();
    }
});
