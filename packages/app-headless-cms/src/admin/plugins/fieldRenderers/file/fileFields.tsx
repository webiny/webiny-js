import React, { useState } from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import MultipleFile from "./MultipleFile";

const t = i18n.ns("app-headless-cms/admin/fields/file");

function CmsEditorFieldRenderer({ field, getBind, Label }) {
    const [previewURLs, setPreviewURLs] = useState({});

    const Bind = getBind();
    const FirstFieldBind = getBind(0);

    return (
        <Bind>
            {({ appendValues, value, appendValue }) => (
                <Grid>
                    <Cell span={12}>
                        <Label>
                            <I18NValue value={field.label} />
                        </Label>
                    </Cell>
                    <Cell span={3}>
                        <FirstFieldBind>
                            {bind => (
                                <MultipleFile
                                    previewURLs={previewURLs}
                                    setPreviewURLs={setPreviewURLs}
                                    field={field}
                                    bind={bind}
                                    appendValue={appendValues}
                                    removeValue={bind.removeValue}
                                />
                            )}
                        </FirstFieldBind>
                    </Cell>

                    {value.slice(1).map((item, index) => {
                        const Bind = getBind(index + 1);
                        return (
                            <Cell span={3} key={index + 1}>
                                <Bind>
                                    {bind => (
                                        <MultipleFile
                                            previewURLs={previewURLs}
                                            setPreviewURLs={setPreviewURLs}
                                            field={field}
                                            bind={bind}
                                            appendValue={appendValues}
                                            removeValue={bind.removeValue}
                                        />
                                    )}
                                </Bind>
                            </Cell>
                        );
                    })}
                    {value.length >= 1 && <Cell span={3}>
                        <MultipleFile
                            previewURLs={previewURLs}
                            setPreviewURLs={setPreviewURLs}
                            field={field}
                            bind={{ value: null, onChange: appendValue }}
                            appendValue={appendValues}
                            removeValue={() => null}
                        />
                    </Cell>}
                </Grid>
            )}
        </Bind>
    );
}

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-files",
    renderer: {
        rendererName: "file-inputs",
        name: t`File Inputs`,
        description: t`Enables selecting multiple files via File Manager.`,
        canUse({ field }) {
            return field.type === "file" && field.multipleValues;
        },
        render({ field, getBind, Label }) {
            return <CmsEditorFieldRenderer field={field} getBind={getBind} Label={Label} />
        }
    }
};

export default plugin;
