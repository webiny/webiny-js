import React from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { I18NValue } from "@webiny/app-i18n/components";
import { Input } from "@webiny/ui/Input";
import { ButtonDefault } from "@webiny/ui/Button";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/close.svg";
import { css } from "emotion";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const style = {
    addButton: css({
        textAlign: "center",
        width: "100%"
    })
};

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-text-inputs",
    renderer: {
        rendererName: "text-inputs",
        name: t`Text Inputs`,
        description: t`Renders a simple list of text inputs.`,
        canUse({ field }) {
            return field.type === "text" && field.multipleValues && !field.predefinedValues;
        },
        render({ field, getBind, Label }) {
            const Bind = getBind();
            const FirstFieldBind = getBind(0);

            return (
                <Bind>
                    {({ appendValue, value }) => (
                        <Grid>
                            <Cell span={12}>
                                <Label>
                                    <I18NValue value={field.label} />
                                </Label>
                                <FirstFieldBind>
                                    {bind => (
                                        <Input
                                            {...bind}
                                            label={t`Value {number}`({ number: 1 })}
                                            placeholder={I18NValue({
                                                value: field.placeholderText
                                            })}
                                        />
                                    )}
                                </FirstFieldBind>
                            </Cell>

                            {value.slice(1).map((item, index) => {
                                const Bind = getBind(index + 1);
                                return (
                                    <Cell span={12} key={index + 1}>
                                        <Bind>
                                            {bind => (
                                                <Input
                                                    {...bind}
                                                    trailingIcon={{
                                                        icon: <DeleteIcon />,
                                                        onClick: bind.removeValue
                                                    }}
                                                    label={t`Value {number}`({ number: index + 2 })}
                                                    placeholder={I18NValue({
                                                        value: field.placeholderText
                                                    })}
                                                />
                                            )}
                                        </Bind>
                                    </Cell>
                                );
                            })}
                            <Cell span={12} className={style.addButton}>
                                <ButtonDefault
                                    disabled={value[0] === undefined}
                                    onClick={() => appendValue("")}
                                >{t`+ Add value`}</ButtonDefault>
                            </Cell>
                        </Grid>
                    )}
                </Bind>
            );
        }
    }
};

export default plugin;
