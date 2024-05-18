import React from "react";
import classSet from "classnames";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { BindComponent, BindComponentRenderProp, CmsModelField } from "~/types";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { GetBindCallable } from "~/admin/components/ContentEntryForm/useBind";
import { ParentFieldProvider } from "~/admin/hooks";
import { ParentValueIndexProvider } from "~/admin/components/ModelFieldProvider";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const style = {
    gridContainer: css`
        padding: 0 !important;
    `,
    addButton: css({
        width: "100%",
        borderTop: "1px solid var(--mdc-theme-background)",
        paddingTop: 8
    })
};

export interface DynamicSectionPropsChildrenParams {
    Bind: BindComponent;
    field: CmsModelField;
    bind: {
        index: BindComponentRenderProp;
        field: BindComponentRenderProp;
    };
    index: number;
}

export interface DynamicSectionProps {
    field: CmsModelField;
    getBind: GetBindCallable;
    showLabel?: boolean;
    Label: React.ComponentType<any>;
    children: (params: DynamicSectionPropsChildrenParams) => JSX.Element;
    emptyValue?: any;
    renderTitle?: (value: any[]) => React.ReactElement;
    gridClassName?: string;
}

const DynamicSection = ({
    field,
    getBind,
    Label,
    children,
    showLabel = true,
    emptyValue = "",
    renderTitle,
    gridClassName
}: DynamicSectionProps) => {
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

                const bindFieldValue: string[] = value || [];
                return (
                    <ParentFieldProvider value={value} path={Bind.parentName}>
                        <Grid className={classSet(gridClassName, style.gridContainer)}>
                            {typeof renderTitle === "function" && renderTitle(bindFieldValue)}
                            <Cell span={12}>
                                {/* We always render the first item, for better UX */}
                                {showLabel && field.label && <Label>{field.label}</Label>}

                                <FirstFieldBind>
                                    {bindProps => (
                                        <ParentValueIndexProvider index={0}>
                                            {/* We bind it to index "0", so when you start typing, that index in parent array will be populated */}
                                            {children({
                                                Bind: FirstFieldBind,
                                                field,
                                                // "index" contains Bind props for this particular item in the array
                                                // "field" contains Bind props for the main (parent) field.
                                                bind: {
                                                    index: bindProps,
                                                    field: bindField
                                                },
                                                index: 0 // Binds to "items.0" in the <Form>.
                                            })}
                                        </ParentValueIndexProvider>
                                    )}
                                </FirstFieldBind>
                            </Cell>

                            {/* Now we skip the first item, because we already rendered it above, and proceed with all other items. */}
                            {bindFieldValue.slice(1).map((_, index) => {
                                /* We simply increase index, and as you type, the appropriate indexes in the parent array will be updated. */
                                const realIndex = index + 1;
                                const BindField = getBind(realIndex);
                                return (
                                    <Cell span={12} key={realIndex}>
                                        <BindField>
                                            {bindProps => (
                                                <ParentValueIndexProvider index={realIndex}>
                                                    {children({
                                                        Bind: BindField,
                                                        field,
                                                        bind: {
                                                            index: bindProps,
                                                            field: bindField
                                                        },
                                                        index: realIndex
                                                    })}
                                                </ParentValueIndexProvider>
                                            )}
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
                                >
                                    <ButtonIcon icon={<AddIcon />} />
                                    {t`Add value`}
                                </ButtonDefault>
                            </Cell>
                        </Grid>
                    </ParentFieldProvider>
                );
            }}
        </Bind>
    );
};

export default DynamicSection;
