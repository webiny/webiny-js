import React from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Grid, Cell, GridInner } from "@webiny/ui/Grid";
import { i18n } from "@webiny/app/i18n";
import { DynamicFieldset } from "@webiny/ui/DynamicFieldset";
import { Typography } from "@webiny/ui/Typography";
import { ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { CmsEditorField } from "~/types";

const t = i18n.ns("app-headless-cms/admin/fields/dynamic-fieldset-predefined-values");

const Fieldset = styled("div")({
    position: "relative",
    width: "100%",
    marginBottom: 15,
    ".webiny-ui-button": {
        position: "absolute",
        display: "block",
        right: 10,
        top: 13
    }
});

const controlButtons = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ">button": {
        marginRight: 15
    }
});

const emptyStyles = css({
    textAlign: "center"
});

const Header = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 15
});

interface OnSelectedParams {
    bind: any;
    field: CmsEditorField;
    index: string;
    value: boolean;
}
const onSelectedChange = (params: OnSelectedParams) => {
    const { bind, field, index: targetIndex, value: setToValue } = params;
    bind.form.setValue(
        "predefinedValues.values",
        bind.value.map((value, index) => {
            const defaultValue = field.multipleValues ? value.selected : false;
            return {
                ...value,
                selected: index === targetIndex ? setToValue : defaultValue
            };
        })
    );
};

export interface Props {
    getBind: (value?: any) => any;
    renderValueInput?: any;
    field: CmsEditorField;
}
const PredefinedValuesDynamicFieldset: React.FC<Props> = ({
    getBind,
    renderValueInput = null,
    field
}) => {
    const Bind = getBind();

    return (
        <Grid>
            <Cell span={12}>
                <Bind>
                    {bind => {
                        return (
                            <DynamicFieldset {...bind}>
                                {({ actions, header, row, empty }) => (
                                    <React.Fragment>
                                        {row(({ index }) => {
                                            const Bind = getBind(index);

                                            return (
                                                <React.Fragment>
                                                    <GridInner>
                                                        <Cell span={4}>
                                                            <Fieldset>
                                                                <Bind name={"label"}>
                                                                    <Input label={t`Label`} />
                                                                </Bind>
                                                            </Fieldset>
                                                        </Cell>
                                                        <Cell span={4}>
                                                            <Fieldset>
                                                                {renderValueInput ? (
                                                                    renderValueInput(Bind)
                                                                ) : (
                                                                    <Bind name={"value"}>
                                                                        <Input label={t`Value`} />
                                                                    </Bind>
                                                                )}
                                                            </Fieldset>
                                                        </Cell>
                                                        <Cell span={2}>
                                                            <Fieldset>
                                                                <Bind name={"selected"}>
                                                                    {selectedBind => {
                                                                        return (
                                                                            <Switch
                                                                                {...selectedBind}
                                                                                label={"Selected"}
                                                                                description={
                                                                                    "Mark as selected value"
                                                                                }
                                                                                onChange={(
                                                                                    value: boolean
                                                                                ) => {
                                                                                    onSelectedChange(
                                                                                        {
                                                                                            bind,
                                                                                            field,
                                                                                            index,
                                                                                            value
                                                                                        }
                                                                                    );
                                                                                }}
                                                                            />
                                                                        );
                                                                    }}
                                                                </Bind>
                                                            </Fieldset>
                                                        </Cell>

                                                        <Cell span={2} className={controlButtons}>
                                                            <ButtonPrimary
                                                                small
                                                                onClick={actions.add(index)}
                                                            >
                                                                +
                                                            </ButtonPrimary>
                                                            <ButtonSecondary
                                                                small
                                                                onClick={actions.remove(index)}
                                                            >
                                                                -
                                                            </ButtonSecondary>
                                                        </Cell>
                                                    </GridInner>
                                                </React.Fragment>
                                            );
                                        })}
                                        {empty(() => (
                                            <React.Fragment>
                                                <Header>
                                                    <Typography
                                                        use={"overline"}
                                                    >{t`Predefined values`}</Typography>
                                                </Header>

                                                <GridInner className={emptyStyles}>
                                                    <Cell span={12}>
                                                        <Typography use={"subtitle1"}>
                                                            {t`There are no predefined values available.`}
                                                        </Typography>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <ButtonPrimary
                                                            onClick={actions.add()}
                                                        >{t`Add a predefined value`}</ButtonPrimary>
                                                    </Cell>
                                                </GridInner>
                                            </React.Fragment>
                                        ))}
                                        {header(() => (
                                            <Header>
                                                <Typography
                                                    use={"overline"}
                                                >{t`Predefined values`}</Typography>
                                            </Header>
                                        ))}
                                    </React.Fragment>
                                )}
                            </DynamicFieldset>
                        );
                    }}
                </Bind>
            </Cell>
        </Grid>
    );
};

export default PredefinedValuesDynamicFieldset;
