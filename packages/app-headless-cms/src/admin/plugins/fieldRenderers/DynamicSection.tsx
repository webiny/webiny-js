import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import { ButtonDefault } from "@webiny/ui/Button";
import { CmsEditorField } from "~/types";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const style = {
    addButton: css({
        textAlign: "center",
        width: "100%"
    })
};

type Props = {
    field: CmsEditorField;
    getBind(index?: number): React.ComponentType<any>;
    showLabel?: boolean;
    Label: React.ComponentType<any>;
    children: (params: any) => React.ReactNode;
    emptyValue?: any;
};

const DynamicSection = ({ field, getBind, Label, children, showLabel = true, emptyValue = "" }: Props) => {
    const Bind = getBind();
    const FirstFieldBind = getBind(0);

    return (
        /* First we mount the top level field, for example: "items" */
        <Bind>
            {bindField => {
                /**
                 * "value" -> an array of items
                 * "appendValue" -> a callback to add a new value to the top level "items" array
                 */
                const { value, appendValue } = bindField;

                const bindFieldValue = value || [];
                return (
                    <Grid>
                        <Cell span={12}>
                            {/* We always render the first item, for better UX */}
                            {showLabel && field.label && <Label>{field.label}</Label>}
                            <FirstFieldBind>
                                {bindIndex =>
                                    /* We bind it to index "0", so when you start typing, that index in parent array will be populated */
                                    children({
                                        Bind: FirstFieldBind,
                                        field,
                                        // "index" contains Bind props for this particular item in the array
                                        // "field" contains Bind props for the main (parent) field.
                                        bind: { index: bindIndex, field: bindField },
                                        index: 0 // Binds to "items.0" in the <Form>.
                                    })
                                }
                            </FirstFieldBind>
                        </Cell>

                        {/* Now we skip the first item, because we already rendered it above, and proceed with all other items. */}
                        {bindFieldValue.slice(1).map((item, index) => {
                            /* We simply increase index, and as you type, the appropriate indexes in the parent array will be updated. */
                            const realIndex = index + 1;
                            const BindField = getBind(realIndex);
                            return (
                                <Cell span={12} key={realIndex}>
                                    <BindField>
                                        {bindIndex =>
                                            children({
                                                Bind: BindField,
                                                field,
                                                bind: { index: bindIndex, field: bindField },
                                                index: realIndex
                                            })
                                        }
                                    </BindField>
                                </Cell>
                            );
                        })}

                        {bindField.validation.isValid === false && (
                            <Cell span={12}>
                                <FormElementMessage error>
                                    {bindField.validation.message}
                                </FormElementMessage>
                            </Cell>
                        )}
                        <Cell span={12} className={style.addButton}>
                            <ButtonDefault
                                disabled={bindFieldValue[0] === undefined}
                                onClick={() => appendValue(emptyValue)}
                            >{t`+ Add value`}</ButtonDefault>
                        </Cell>
                    </Grid>
                );
            }}
        </Bind>
    );
};

export default DynamicSection;
