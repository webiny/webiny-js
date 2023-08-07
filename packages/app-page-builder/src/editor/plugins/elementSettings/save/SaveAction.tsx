import React, { useEffect, useCallback, useState } from "react";
/**
 * Package dataurl-to-blob does not have types.
 */
// @ts-ignore
import SaveDialog from "./SaveDialog";
import pick from "lodash/pick";
import get from "lodash/get";
import createElementPlugin from "~/admin/utils/createElementPlugin";
import createBlockPlugin from "~/admin/utils/createBlockPlugin";
import { activeElementAtom, elementByIdSelector } from "~/editor/recoil/modules";
import { useApolloClient } from "@apollo/react-hooks";
import { plugins } from "@webiny/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useKeyHandler } from "~/editor/hooks/useKeyHandler";
import { CREATE_PAGE_ELEMENT, UPDATE_PAGE_ELEMENT } from "~/admin/graphql/pages";
import {
    CREATE_PAGE_BLOCK,
    UPDATE_PAGE_BLOCK,
    LIST_PAGE_BLOCKS_AND_CATEGORIES
} from "~/admin/views/PageBlocks/graphql";
import { useRecoilValue } from "recoil";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementSaveActionPlugin,
    PbEditorElement as BasePbEditorElement,
    PbElement,
    PbEditorElement
} from "~/types";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { removeElementId } from "~/editor/helpers";
interface PbDocumentElement extends BasePbEditorElement {
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

        if (formData.type === "block") {
            const query = formData.overwrite ? UPDATE_PAGE_BLOCK : CREATE_PAGE_BLOCK;

            const { data: res } = await client.mutate({
                mutation: query,
                variables: formData.overwrite
                    ? {
                          id: element.source,
                          data: pick(formData, ["content"])
                      }
                    : { data: pick(formData, ["name", "blockCategory", "content"]) },
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
                          data: pick(formData, ["content"])
                      }
                    : { data: pick(formData, ["type", "category", "name", "content"]) }
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
