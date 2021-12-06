import React, { useEffect, useCallback, useState } from "react";
import dataURLtoBlob from "dataurl-to-blob";
import SaveDialog from "./SaveDialog";
import pick from "lodash.pick";
import get from "lodash/get";
import createElementPlugin from "../../../../admin/utils/createElementPlugin";
import createBlockPlugin from "../../../../admin/utils/createBlockPlugin";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import { useApolloClient } from "@apollo/react-hooks";
import { plugins } from "@webiny/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useKeyHandler } from "../../../hooks/useKeyHandler";
import { CREATE_PAGE_ELEMENT, UPDATE_PAGE_ELEMENT } from "../../../../admin/graphql/pages";
import { useRecoilValue } from "recoil";
import { CREATE_FILE } from "./SaveDialog/graphql";
import { FileUploaderPlugin } from "@webiny/app/types";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementSaveActionPlugin,
    PbEditorElement
} from "../../../../types";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";

const removeIds = el => {
    delete el.id;

    el.elements = el.elements.map(el => {
        delete el.id;
        if (el.elements && el.elements.length) {
            el = removeIds(el);
        }

        return el;
    });

    return el;
};

type ImageDimensionsType = {
    width: number;
    height: number;
};
function getDataURLImageDimensions(dataURL: string): Promise<ImageDimensionsType> {
    return new Promise(resolve => {
        const image = new window.Image();
        image.onload = function () {
            resolve({ width: image.width, height: image.height });
        };
        image.src = dataURL;
    });
}

const pluginOnSave = (element: PbEditorElement): PbEditorElement => {
    const plugin = plugins
        .byType<PbEditorPageElementSaveActionPlugin>("pb-editor-page-element-save-action")
        .find(pl => pl.elementType === element.type);
    if (!plugin) {
        return element;
    }
    return plugin.onSave(element);
};

const SaveAction: React.FunctionComponent = ({ children }) => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElementId));
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const { getElementTree } = useEventActionHandler();
    const { showSnackbar } = useSnackbar();
    const [isDialogOpened, setOpenDialog] = useState<boolean>(false);
    const client = useApolloClient();

    const onSubmit = async formData => {
        formData.content = pluginOnSave(removeIds(await getElementTree(element)));

        const meta = await getDataURLImageDimensions(formData.preview);
        const blob = dataURLtoBlob(formData.preview);
        blob.name = "pb-editor-page-element-" + element.id + ".png";

        const fileUploaderPlugin = plugins.byName<FileUploaderPlugin>("app-file-manager-storage");
        const previewImage = await fileUploaderPlugin.upload(blob, { apolloClient: client });
        previewImage.meta = meta;
        previewImage.meta.private = true;

        const createdImageResponse = await client.mutate({
            mutation: CREATE_FILE,
            variables: {
                data: previewImage
            }
        });

        const createdImage = get(createdImageResponse, "data.fileManager.createFile", {});
        if (createdImage.error) {
            return showSnackbar("Image could not be saved.");
        } else if (!createdImage.data.id) {
            return showSnackbar("Missing saved image id.");
        }

        formData.preview = createdImage.data;

        const query = formData.overwrite ? UPDATE_PAGE_ELEMENT : CREATE_PAGE_ELEMENT;

        const { data: res } = await client.mutate({
            mutation: query,
            variables: formData.overwrite
                ? {
                      id: element.source,
                      data: pick(formData, ["content", "id", "preview"])
                  }
                : { data: pick(formData, ["type", "category", "preview", "name", "content"]) }
        });

        hideDialog();
        const mutationName = formData.overwrite ? "updatePageElement" : "createPageElement";
        const data = get(res, `pageBuilder.${mutationName}.data`);
        if (data.type === "block") {
            createBlockPlugin(data);
        } else {
            createElementPlugin(data);
        }

        showSnackbar(
            <span>
                {formData.type[0].toUpperCase() + formData.type.slice(1)}{" "}
                <strong>{data.name}</strong> was saved!
            </span>
        );
    };

    useEffect(() => {
        isDialogOpened ? addKeyHandler("escape", hideDialog) : removeKeyHandler("escape");
    }, [isDialogOpened]);

    const showDialog = useCallback(() => setOpenDialog(true), []);
    const hideDialog = useCallback(() => setOpenDialog(false), []);

    if (!element) {
        return null;
    }

    const plugin = plugins
        .byType(PbEditorPageElementPlugin)
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return (
        <>
            <SaveDialog
                key={element.id}
                element={element}
                open={isDialogOpened}
                onClose={hideDialog}
                onSubmit={onSubmit}
                type={element.type === "block" ? "block" : "element"}
            />
            {React.cloneElement(children as React.ReactElement, { onClick: showDialog })}
        </>
    );
};

export default SaveAction;
