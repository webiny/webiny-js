/**
 * Package dataurl-to-blob does not have types.
 */
// @ts-ignore
import dataURLtoBlob from "dataurl-to-blob";
import get from "lodash/get";
import { plugins } from "@webiny/plugins";
import { FileUploaderPlugin } from "@webiny/app/types";
import domToImage from "~/editor/plugins/elementSettings/save/SaveDialog/domToImage";
import { CREATE_FILE, DELETE_FILE } from "~/editor/plugins/elementSettings/save/SaveDialog/graphql";
import { File, PbElement, EventActionHandlerMeta } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";

interface ImageDimensionsType {
    width: number;
    height: number;
}

function getDataURLImageDimensions(dataURL: string): Promise<ImageDimensionsType> {
    return new Promise(resolve => {
        const image = new window.Image();
        image.onload = function () {
            resolve({ width: image.width, height: image.height });
        };
        image.src = dataURL;
    });
}

function takePageScreenshot(element: PbElement) {
    const node = isLegacyRenderingEngine
        ? document.getElementById(element.id)
        : document.querySelector("pb-document");

    if (!node) {
        return null;
    }

    if (isLegacyRenderingEngine) {
        return domToImage.toPng(node, { width: 1000 });
    }

    return domToImage.toPng(node, {
        width: 2000,
        filter: (element: Element) => {
            return element.tagName !== "PB-ELEMENT-CONTROLS-OVERLAY";
        }
    });
}

export async function getPreviewImage(
    element: PbElement,
    meta: EventActionHandlerMeta,
    prevFileId?: string
): Promise<File | null> {
    const editor = document.querySelector(".pb-editor");
    // Hide element highlight while creating the image
    editor && editor.classList.add("pb-editor-no-highlight");

    const dataUrl = await takePageScreenshot(element);

    editor && editor.classList.remove("pb-editor-no-highlight");

    if (!dataUrl) {
        return null;
    }

    const imageMeta = await getDataURLImageDimensions(dataUrl);
    const blob = dataURLtoBlob(dataUrl);
    blob.name = "pb-editor-page-element-" + element.id + ".png";

    const fileUploaderPlugin = plugins.byName<FileUploaderPlugin>("app-file-manager-storage");

    /**
     * We break the method because it would break if there is no fileUploaderPlugin.
     */
    if (!fileUploaderPlugin) {
        return null;
    }

    const previewImage = await fileUploaderPlugin.upload(blob, { apolloClient: meta.client });
    previewImage.meta = imageMeta;
    previewImage.meta.private = true;

    const createdImageResponse = await meta.client.mutate({
        mutation: CREATE_FILE,
        variables: {
            data: previewImage
        }
    });

    // Delete previous preview image file
    if (prevFileId) {
        await meta.client.mutate({
            mutation: DELETE_FILE,
            variables: {
                id: prevFileId
            }
        });
    }

    return get(createdImageResponse, "data.fileManager.createFile.data", null);
}
