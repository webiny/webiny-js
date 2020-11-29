import invariant from "invariant";
import { connectedReadSelector } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { contentAtom } from "../contentAtom";
import { PbDocumentElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";

export const contentSelector = connectedReadSelector<PbElement>({
    key: "contentSelector",
    get: ({ get }) => {
        const content = get(contentAtom);
        if (content) {
            return content;
        }

        const document = plugins.byName<PbDocumentElementPlugin>("pb-editor-page-element-document");
        invariant(
            document,
            `"pb-editor-page-element-document" plugin must exist for Page Builder to work!`
        );
        return document.create();
    }
});
