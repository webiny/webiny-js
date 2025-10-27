import React from "react";
import classSet from "classnames";
import { css } from "@emotion/css";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { GetBindCallable } from "~/admin/components/ContentEntryForm/useBind.js";
import { ParentFieldProvider } from "~/admin/hooks/index.js";
import { ParentValueIndexProvider } from "~/admin/components/ModelFieldProvider/index.js";
import type { BindComponent, BindComponentRenderProp, CmsModelField } from "~/types.js";
import { getMultiValueRendererSettings } from "~/admin/plugins/fieldRenderers/MultiValueRendererSettings.js";
import {
    Button,
    cn,
    FormComponentDescription,
    FormComponentErrorMessage,
    Grid,
    Heading
} from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/text");

const style = {
    gridContainer: css`
        padding: 0 !important;
    `
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
    children: (params: DynamicSectionPropsChildrenParams) => JSX.Element;
    emptyValue?: any;
    gridClassName?: string;
    onAddItem?: (index: number) => void;
    addValueButtonLabel?: string;
}

const defaultAddItem = () => {
    // No op.
};

const DynamicSection = ({
    field,
    getBind,
    children,
    showLabel = true,
    emptyValue = "",
    onAddItem = defaultAddItem,
    gridClassName,
    ...props
}: DynamicSectionProps) => {
    const Bind = getBind();

    const settings = getMultiValueRendererSettings(field);
    const addValueButtonLabel =
        props.addValueButtonLabel ?? settings.addValueButtonLabel ?? "Add Value";

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
                    <Bind.ValidationContainer>
                        <ParentFieldProvider value={value} path={Bind.parentName}>
                            {showLabel ? (
                                <div
                                    className={
                                        "wby-relative wby-mb-xl wby-mt-md wby-border-b-sm wby-border-accent-dimmed"
                                    }
                                >
                                    <Heading
                                        level={6}
                                        className={
                                            "webiny_group-label-text wby-absolute wby-bottom-[-10px] wby-pr-sm wby-text-accent-primary wby-bg-white"
                                        }
                                    >
                                        {`${field.label} ${
                                            bindFieldValue.length
                                                ? `(${bindFieldValue.length})`
                                                : ""
                                        }`}
                                    </Heading>
                                    {field.helpText && (
                                        <FormComponentDescription text={field.helpText} />
                                    )}
                                </div>
                            ) : null}
                            <Grid className={classSet(gridClassName, style.gridContainer)}>
                                <>
                                    {bindFieldValue.map((_, index) => {
                                        const BindField = getBind(index);
                                        return (
                                            <Grid.Column span={12} key={index}>
                                                <BindField>
                                                    {bindProps => (
                                                        <BindField.ValidationContainer>
                                                            <ParentValueIndexProvider index={index}>
                                                                {children({
                                                                    Bind: BindField,
                                                                    field,
                                                                    bind: {
                                                                        index: bindProps,
                                                                        field: bindField
                                                                    },
                                                                    index
                                                                })}
                                                            </ParentValueIndexProvider>
                                                        </BindField.ValidationContainer>
                                                    )}
                                                </BindField>
                                            </Grid.Column>
                                        );
                                    })}
                                </>
                                <>
                                    {bindField.validation.isValid === false && (
                                        <Grid.Column span={12}>
                                            <FormComponentErrorMessage
                                                invalid
                                                text={bindField.validation.message}
                                            />
                                        </Grid.Column>
                                    )}
                                </>
                                <Grid.Column span={12}>
                                    <div
                                        className={cn(
                                            bindFieldValue.length > 0 ? "wby-pt-none" : "wby-pt-sm"
                                        )}
                                    >
                                        <Button
                                            variant={"tertiary"}
                                            icon={<AddIcon />}
                                            text={t(addValueButtonLabel)}
                                            onClick={() => {
                                                appendValue(emptyValue);
                                                onAddItem(bindFieldValue.length);
                                            }}
                                        />
                                    </div>
                                </Grid.Column>
                            </Grid>
                        </ParentFieldProvider>
                    </Bind.ValidationContainer>
                );
            }}
        </Bind>
    );
};

export default DynamicSection;
