// @flow
import React, { useEffect, useCallback, useState } from "react";
import { useApolloClient } from "react-apollo";
import { cloneDeep } from "lodash";
import dataURLtoBlob from "dataurl-to-blob";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPlugins, getPlugin } from "@webiny/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import {
    getActiveElementId,
    getElementWithChildren
} from "@webiny/app-page-builder/editor/selectors";
import createElementPlugin from "@webiny/app-page-builder/admin/utils/createElementPlugin";
import createBlockPlugin from "@webiny/app-page-builder/admin/utils/createBlockPlugin";
import { CREATE_ELEMENT, UPDATE_ELEMENT } from "@webiny/app-page-builder/admin/graphql/pages";
import SaveDialog from "./SaveDialog";

type Props = {
    isDialogOpened: boolean,
    showDialog: Function,
    hideDialog: Function,
    onSubmit: Function,
    children: any,
    element: Object
};

const SaveAction = (props: Props) => {
    const { children, element } = props;
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const { showSnackbar } = useSnackbar();
    const [isDialogOpened, setOpenDialog] = useState(false);
    const client = useApolloClient();

    const onSubmit = useHandler(props, ({ element }) => async formData => {
        formData.content = removeIdsAndPaths(cloneDeep(element));

        const meta = await getDataURLImageDimensions(formData.preview);
        const blob = dataURLtoBlob(formData.preview);
        blob.name = "pb-page-element-" + element.id + ".png";

        const fileUploaderPlugin = getPlugin("file-uploader");
        formData.preview = await fileUploaderPlugin.upload(blob, { apolloClient: client });

        formData.preview.meta = meta;
        formData.preview.meta.private = true;

        let query = formData.overwrite ? UPDATE_ELEMENT : CREATE_ELEMENT;
        const { data: res } = await client.mutate({
            mutation: query,
            variables: formData.overwrite
                ? {
                      id: element.source,
                      data: { content: formData.content, preview: formData.preview }
                  }
                : { data: formData }
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
                <strong>{data.name}</strong> saved!
            </span>
        );
    });

    useEffect(() => {
        isDialogOpened ? addKeyHandler("escape", hideDialog) : removeKeyHandler("escape");
    }, [isDialogOpened]);

    const showDialog = useCallback(() => setOpenDialog(true), []);
    const hideDialog = useCallback(() => setOpenDialog(false), []);

    if (!element) {
        return null;
    }

    const plugin = getPlugins("pb-page-element").find(pl => pl.elementType === element.type);
    if (!plugin) {
        return null;
    }

    return (
        <React.Fragment>
            <SaveDialog
                key={element.id}
                element={element}
                open={isDialogOpened}
                onClose={hideDialog}
                onSubmit={onSubmit}
                type={element.type === "block" ? "block" : "element"}
            />
            {React.cloneElement(children, { onClick: showDialog })}
        </React.Fragment>
    );
};

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

function getDataURLImageDimensions(dataURL: string) {
    return new Promise(resolve => {
        const image = new window.Image();
        image.onload = function() {
            resolve({ width: image.width, height: image.height });
        };
        image.src = dataURL;
    });
}

export default connect(state => ({
    element: getElementWithChildren(state, getActiveElementId(state))
}))(SaveAction);
