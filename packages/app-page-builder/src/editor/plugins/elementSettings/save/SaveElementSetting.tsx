import React, { useState } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { useApolloClient } from "react-apollo";
import cloneDeep from "lodash/cloneDeep";
import pick from "lodash.pick";
import dataURLtoBlob from "dataurl-to-blob";
import styled from "@emotion/styled";

import { plugins } from "@webiny/plugins";
import { CircularProgress } from "@webiny/ui/Progress";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Switch } from "@webiny/ui/Switch";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { ButtonSecondary } from "@webiny/ui/Button";
import { Form } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FileUploaderPlugin } from "@webiny/app/types";
import {
    PbEditorBlockCategoryPlugin,
    PbEditorPageElementPlugin,
    PbEditorPageElementSaveActionPlugin,
    PbElement
} from "@webiny/app-page-builder/types";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { CREATE_ELEMENT, UPDATE_ELEMENT } from "@webiny/app-page-builder/admin/graphql/pages";
import createBlockPlugin from "@webiny/app-page-builder/admin/utils/createBlockPlugin";
import createElementPlugin from "@webiny/app-page-builder/admin/utils/createElementPlugin";
// Components
import Accordion from "../components/Accordion";
import { CREATE_FILE } from "./SaveDialog/graphql";
import ElementPreview from "./SaveDialog/ElementPreview";

const gridClass = css({
    "&.mdc-layout-grid": {
        padding: 0,
        margin: 0,
        marginBottom: 24
    }
});

const PreviewBox = styled("div")({
    width: "100%",
    minHeight: 250,
    border: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "#fff", // this must always be white
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    img: {
        width: "100%",
        maxHeight: 500,
        maxWidth: 500
    }
});

// SaveAction

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

const pluginOnSave = (element: PbElement): PbElement => {
    const plugin = plugins
        .byType<PbEditorPageElementSaveActionPlugin>("pb-editor-page-element-save-action")
        .find(pl => pl.elementType === element.type);
    if (!plugin) {
        return element;
    }
    return plugin.onSave(element);
};

// Save Action

const SaveElementSettings = () => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const onSubmit = async formData => {
        formData.content = pluginOnSave(removeIdsAndPaths(cloneDeep(element)));

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

    if (!element) {
        return null;
    }

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    const type = element.type === "block" ? "block" : "element";

    const [loading, setLoading] = useState(false);

    const blockCategoriesOptions = plugins
        .byType<PbEditorBlockCategoryPlugin>("pb-editor-block-category")
        .map(item => {
            return {
                value: item.categoryName,
                label: item.title
            };
        });

    return (
        <Accordion title={"Save element"}>
            <Form
                onSubmit={async data => {
                    setLoading(true);
                    await onSubmit(data);
                    setLoading(false);
                }}
                data={{ type, category: "general" }}
            >
                {({ data, submit, Bind }) => (
                    <React.Fragment>
                        {loading && <CircularProgress label={`Saving ${type}...`} />}

                        {element.source && (
                            <Grid className={gridClass}>
                                <Cell span={12}>
                                    <Bind name="overwrite">
                                        <Switch label="Update existing" />
                                    </Bind>
                                </Cell>
                            </Grid>
                        )}
                        {!data.overwrite && (
                            <Grid className={gridClass}>
                                <Cell span={12}>
                                    <Bind name={"name"} validators={validation.create("required")}>
                                        <Input label={"Name"} autoFocus />
                                    </Bind>
                                </Cell>
                            </Grid>
                        )}
                        {data.type === "block" && !data.overwrite && (
                            <>
                                <Grid className={gridClass}>
                                    <Cell span={12}>
                                        <Bind
                                            name="category"
                                            validators={validation.create("required")}
                                        >
                                            <Select
                                                label="Category"
                                                description="Select a block category"
                                                options={blockCategoriesOptions}
                                            />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </>
                        )}
                        <Grid className={gridClass}>
                            <Cell span={12}>
                                <PreviewBox>
                                    <Bind name={"preview"}>
                                        {({ value, onChange }) =>
                                            value ? (
                                                <img src={value} alt={""} />
                                            ) : (
                                                <ElementPreview
                                                    key={element.id}
                                                    onChange={onChange}
                                                    element={element}
                                                />
                                            )
                                        }
                                    </Bind>
                                </PreviewBox>
                            </Cell>
                        </Grid>
                        <Grid className={gridClass}>
                            <Cell span={12}>
                                <ButtonSecondary onClick={submit}>Save</ButtonSecondary>
                            </Cell>
                        </Grid>
                    </React.Fragment>
                )}
            </Form>
        </Accordion>
    );
};

export default React.memo(SaveElementSettings);
