import { CreateElementEventActionCallable } from "../../../recoil/actions/createElement/types";
import { PbEditorPageElementPlugin, PbEditorElement } from "../../../../types";
import { plugins } from "@webiny/plugins";

const MAX_ELEMENT_FIND_RETRIES = 10;
const ELEMENT_FIND_RETRY_TIMEOUT = 100;

const clickOnImageWithRetries = (element: PbEditorElement, retryNumber: number) => {
    const image: HTMLElement = document.querySelector(
        `#${window.CSS.escape(element.id)} [data-role="select-image"]`
    );

    if (image) {
        image.click();
        return;
    } else if (retryNumber >= MAX_ELEMENT_FIND_RETRIES) {
        return;
    }
    setTimeout(() => clickOnImageWithRetries(element, retryNumber + 1), ELEMENT_FIND_RETRY_TIMEOUT);
};

export const imageCreatedEditorAction: CreateElementEventActionCallable = (
    _,
    __,
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
        clickOnImageWithRetries(element, 0);
    }
    return {};
};
