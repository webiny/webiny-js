import React from "react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as RemoveIcon } from "@webiny/icons/remove.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import type { BindComponent, CmsModelField } from "~/types.js";
import type { BindComponentRenderProp, FormAPI } from "@webiny/form";
import { useForm } from "@webiny/form";
import { useModelField } from "~/admin/hooks/index.js";
import {
    Button,
    DynamicFieldset,
    Grid,
    Icon,
    IconButton,
    Input,
    Switch,
    Text
} from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields/dynamic-fieldset-predefined-values");

const Header = (props: React.HTMLProps<HTMLDivElement>) => {
    return <div className={"flex justify-between mb-md"} {...props} />;
};

interface PredefinedValue {
    selected?: boolean;
}

interface OnSelectedParams {
    form: FormAPI;
    bind: BindComponentRenderProp;
    field: CmsModelField;
    index: number;
    value: boolean;
}
const onSelectedChange = (params: OnSelectedParams) => {
    const { form, bind, field, index: targetIndex, value: setToValue } = params;

    form.setValue(
        "predefinedValues.values",
        bind.value.map((value: PredefinedValue, index: number) => {
            const defaultValue = field.multipleValues ? value.selected : false;
            return {
                ...value,
                selected: index === targetIndex ? setToValue : defaultValue
            };
        })
    );
};

export interface PredefinedValuesDynamicFieldsetProps {
    getBind: (value?: any) => BindComponent;
    renderValueInput?: ((Bind: BindComponent) => React.ReactNode) | null;
}
const PredefinedValuesDynamicFieldset = ({
    getBind,
    renderValueInput = null
}: PredefinedValuesDynamicFieldsetProps) => {
    const Bind = getBind();
    const { field } = useModelField();
    const form = useForm();

    return (
        <Grid>
            <Grid.Column span={12}>
                <Bind>
                    {bind => {
                        return (
                            <DynamicFieldset {...bind}>
                                {({ actions, header, row, empty }) => {
                                    return (
                                        <React.Fragment>
                                            {row(({ index }) => {
                                                const Bind = getBind(index);

                                                return (
                                                    <div className={"mb-md"}>
                                                        <Grid>
                                                            <Grid.Column span={4}>
                                                                <Bind name={"label"}>
                                                                    <Input
                                                                        label={t`Label`}
                                                                        size={"lg"}
                                                                    />
                                                                </Bind>
                                                            </Grid.Column>
                                                            <Grid.Column span={4}>
                                                                {renderValueInput ? (
                                                                    renderValueInput(Bind)
                                                                ) : (
                                                                    <Bind name={"value"}>
                                                                        <Input
                                                                            label={t`Value`}
                                                                            size={"lg"}
                                                                        />
                                                                    </Bind>
                                                                )}
                                                            </Grid.Column>
                                                            <Grid.Column span={2}>
                                                                <div
                                                                    className={
                                                                        "flex flex-col justify-end h-full py-sm-plus"
                                                                    }
                                                                >
                                                                    <Bind name={"selected"}>
                                                                        <Switch
                                                                            label={t`Selected`}
                                                                            description={t`Mark as selected value.`}
                                                                            onChange={value => {
                                                                                onSelectedChange({
                                                                                    form,
                                                                                    bind,
                                                                                    field,
                                                                                    index,
                                                                                    value
                                                                                });
                                                                            }}
                                                                        />
                                                                    </Bind>
                                                                </div>
                                                            </Grid.Column>

                                                            <Grid.Column span={2}>
                                                                <div
                                                                    className={
                                                                        "flex justify-end items-end gap-sm h-full py-sm-plus"
                                                                    }
                                                                >
                                                                    <IconButton
                                                                        variant={"primary"}
                                                                        size={"sm"}
                                                                        icon={
                                                                            <Icon
                                                                                label={"Add"}
                                                                                icon={<AddIcon />}
                                                                            />
                                                                        }
                                                                        onClick={actions.add(index)}
                                                                    />
                                                                    <IconButton
                                                                        variant={"secondary"}
                                                                        size={"sm"}
                                                                        icon={
                                                                            <Icon
                                                                                label={"Remove"}
                                                                                icon={
                                                                                    <RemoveIcon />
                                                                                }
                                                                            />
                                                                        }
                                                                        onClick={actions.remove(
                                                                            index
                                                                        )}
                                                                    />
                                                                </div>
                                                            </Grid.Column>
                                                        </Grid>
                                                    </div>
                                                );
                                            })}
                                            {empty(() => {
                                                return (
                                                    <React.Fragment>
                                                        <Header>
                                                            <Text>{t`Predefined values`}</Text>
                                                        </Header>

                                                        <Grid className={"text-center"}>
                                                            <Grid.Column span={12}>
                                                                <Text>{t`There are no predefined values available.`}</Text>
                                                            </Grid.Column>
                                                            <Grid.Column span={12}>
                                                                <Button
                                                                    onClick={actions.add()}
                                                                    text={t`Add a predefined value`}
                                                                />
                                                            </Grid.Column>
                                                        </Grid>
                                                    </React.Fragment>
                                                );
                                            })}
                                            {header(() => (
                                                <Header>
                                                    <Text>{t`Predefined values`}</Text>
                                                </Header>
                                            ))}
                                        </React.Fragment>
                                    );
                                }}
                            </DynamicFieldset>
                        );
                    }}
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

export default PredefinedValuesDynamicFieldset;
