import React, { useEffect, useCallback, useState } from "react";
import dataURLtoBlob from "dataurl-to-blob";
import SaveDialog from "./SaveDialog";
import pick from "lodash.pick";
import createElementPlugin from "@webiny/app-page-builder/admin/utils/createElementPlugin";
import createBlockPlugin from "@webiny/app-page-builder/admin/utils/createBlockPlugin";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { useApolloClient } from "react-apollo";
import { cloneDeep } from "lodash";
import { plugins } from "@webiny/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { CREATE_ELEMENT, UPDATE_ELEMENT } from "@webiny/app-page-builder/admin/graphql/pages";
import { useRecoilValue } from "recoil";
import { CREATE_FILE } from "./SaveDialog/graphql";
import { FileUploaderPlugin } from "@webiny/app/types";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";

const removeIdsAndPaths = el => {
    delete el.id;
    delete el.path;

    el.elements = el.elements.map(el => {
        delete el.id;
        delete el.path;
        if (el.elements && el.elements.length) {
            el = removeIdsAndPaths(el);
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
        image.onload = function() {
            resolve({ width: image.width, height: image.height });
        };
        image.src = dataURL;
    });
}

const SaveAction: React.FunctionComponent = ({ children }) => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const { showSnackbar } = useSnackbar();
    const [isDialogOpened, setOpenDialog] = useState<boolean>(false);
    const client = useApolloClient();

    const onSubmit = async formData => {
        formData.content = removeIdsAndPaths(cloneDeep(element));

        const meta = await getDataURLImageDimensions(formData.preview);
        const blob = dataURLtoBlob(formData.preview);
        blob.name = "pb-editor-page-element-" + element.id + ".png";

        const fileUploaderPlugin = plugins.byName<FileUploaderPlugin>("file-uploader");
        const previewImage = await fileUploaderPlugin.upload(blob, { apolloClient: client });
        previewImage.meta = meta;
        previewImage.meta.private = true;

        const createdImageResponse = await client.mutate({
            mutation: CREATE_FILE,
            variables: {
                data: previewImage
            }
        });

        const createdImage = createdImageResponse?.data?.files?.createFile || {};
        if (createdImage.error) {
            return showSnackbar("Image could not be saved.");
        } else if (!createdImage.data.id) {
            return showSnackbar("Missing saved image id.");
        }

        formData.preview = createdImage.data.id;

        const query = formData.overwrite ? UPDATE_ELEMENT : CREATE_ELEMENT;

        const { data: res } = await client.mutate({
            mutation: query,
            variables: formData.overwrite
                ? {
                      id: element.source,
                      data: pick(formData, ["content", "id"])
                  }
                : { data: pick(formData, ["type", "category", "preview", "name", "content"]) }
        });

        hideDialog();
        const { data } = res.pageBuilder.element;
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
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
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
