import React, { useEffect, useCallback, useState } from "react";
/**
 * Package dataurl-to-blob does not have types.
 */
// @ts-ignore
import dataURLtoBlob from "dataurl-to-blob";
import SaveDialog from "./SaveDialog";
import pick from "lodash/pick";
import get from "lodash/get";
import createElementPlugin from "../../../../admin/utils/createElementPlugin";
import createBlockPlugin from "../../../../admin/utils/createBlockPlugin";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import { useApolloClient } from "@apollo/react-hooks";
import { plugins } from "@webiny/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useKeyHandler } from "../../../hooks/useKeyHandler";
import { CREATE_PAGE_ELEMENT, UPDATE_PAGE_ELEMENT } from "~/admin/graphql/pages";
import {
    CREATE_PAGE_BLOCK,
    UPDATE_PAGE_BLOCK,
    LIST_PAGE_BLOCKS_AND_CATEGORIES
} from "~/admin/views/PageBlocks/graphql";
import { useRecoilValue } from "recoil";
import { CREATE_FILE } from "./SaveDialog/graphql";
import { FileUploaderPlugin } from "@webiny/app/types";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementSaveActionPlugin,
    PbEditorElement as BasePbEditorElement,
    PbElement,
    PbEditorElement
} from "~/types";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { removeElementId } from "~/editor/helpers";

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

interface PbDocumentElement extends BasePbEditorElement {
    preview: string;
    overwrite?: boolean;
}

interface RecoilPbEditorElement extends PbEditorElement {
    source: string;
}

const pluginOnSave = (element: BasePbEditorElement): BasePbEditorElement => {
    const plugin = plugins
        .byType<PbEditorPageElementSaveActionPlugin>("pb-editor-page-element-save-action")
        .find(pl => pl.elementType === element.type);
    if (!plugin) {
        return element;
    }
    return plugin.onSave(element);
};

const SaveAction: React.FC = ({ children }) => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementByIdSelector(activeElementId as string)
    ) as RecoilPbEditorElement;
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const { getElementTree } = useEventActionHandler();
    const { showSnackbar } = useSnackbar();
    const [isDialogOpened, setOpenDialog] = useState<boolean>(false);
    const client = useApolloClient();

    const onSubmit = async (formData: PbDocumentElement) => {
        const pbElement = (await getElementTree({ element })) as PbElement;
        formData.content = pluginOnSave(removeElementId(pbElement));

        const meta = await getDataURLImageDimensions(formData.preview);
        const blob = dataURLtoBlob(formData.preview);
        blob.name = "pb-editor-page-element-" + element.id + ".png";

        const fileUploaderPlugin = plugins.byName<FileUploaderPlugin>("app-file-manager-storage");
        /**
         * We break the method because it would break if there is no fileUploaderPlugin.
         */
        if (!fileUploaderPlugin) {
            return;
        }
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
            showSnackbar("Image could not be saved.");
            return;
        } else if (!createdImage.data.id) {
            showSnackbar("Missing saved image id.");
            return;
        }

        formData.preview = createdImage.data;

        if (formData.type === "block") {
            const query = formData.overwrite ? UPDATE_PAGE_BLOCK : CREATE_PAGE_BLOCK;

            const { data: res } = await client.mutate({
                mutation: query,
                variables: formData.overwrite
                    ? {
                          id: element.source,
                          data: pick(formData, ["content", "preview"])
                      }
                    : { data: pick(formData, ["name", "blockCategory", "preview", "content"]) },
                refetchQueries: [{ query: LIST_PAGE_BLOCKS_AND_CATEGORIES }]
            });

            const { error, data } = get(res, `pageBuilder.pageBlock`);

            if (error) {
                showSnackbar(error.message);
                return;
            }

            hideDialog();

            createBlockPlugin(data);
            showSnackbar(
                <span>
                    {formData.type[0].toUpperCase() + formData.type.slice(1)}{" "}
                    <strong>{data.name}</strong> was saved!
                </span>
            );
        } else {
            const query = formData.overwrite ? UPDATE_PAGE_ELEMENT : CREATE_PAGE_ELEMENT;

            const { data: res } = await client.mutate({
                mutation: query,
                variables: formData.overwrite
                    ? {
                          id: element.source,
                          data: pick(formData, ["content", "preview"])
                      }
                    : { data: pick(formData, ["type", "category", "preview", "name", "content"]) }
            });

            hideDialog();
            const mutationName = formData.overwrite ? "updatePageElement" : "createPageElement";
            const data = get(res, `pageBuilder.${mutationName}.data`);

            createElementPlugin(data);

            showSnackbar(
                <span>
                    {formData.type[0].toUpperCase() + formData.type.slice(1)}{" "}
                    <strong>{data.name}</strong> was saved!
                </span>
            );
        }
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
                onSubmit={data => {
                    /**
                     * We are positive that data is PbEditorElement.
                     */
                    onSubmit(data as PbDocumentElement);
                }}
                type={element.type === "block" ? "block" : "element"}
            />
            {React.cloneElement(children as unknown as React.ReactElement, {
                onClick: showDialog
            })}
        </>
    );
};

export default SaveAction;
