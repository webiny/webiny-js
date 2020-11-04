import { CreateElementEventActionCallableType } from "@webiny/app-page-builder/editor/recoil/actions/createElement/types";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";

export const imageCreatedEditorAction: CreateElementEventActionCallableType = (
    state,
    { element, source }
) => {
    if (element.type !== "image") {
        return {};
    }

    // Check the source of the element (could be `saved` element which behaves differently from other elements)
    const imagePlugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === source.type);

    if (!imagePlugin) {
        return {};
    }

    const { onCreate } = imagePlugin;
    if (!onCreate || onCreate !== "skip") {
        // If source element does not define a specific `onCreate` behavior - continue with the actual element plugin
        // TODO: this isn't an ideal approach, implement a retry mechanism which polls for DOM element
        setTimeout(() => {
            const image: HTMLElement = document.querySelector(
                `#${window.CSS.escape(element.id)} [data-role="select-image"]`
            );

            if (image) {
                image.click();
            }
        }, 100);
    }
    return {};
};
