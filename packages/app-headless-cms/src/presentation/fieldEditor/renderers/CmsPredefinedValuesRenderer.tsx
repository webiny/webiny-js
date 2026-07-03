import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as RemoveIcon } from "@webiny/icons/remove.svg";
import { createObjectFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type {
    IObjectFieldVM,
    IObjectFieldItemVM
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { Button, Grid, Icon, IconButton, Input, Switch, Text } from "@webiny/admin-ui";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsPredefinedValues: { fieldType: "object"; settings: undefined };
    }
}

export const CmsPredefinedValuesRenderer = createObjectFieldRenderer(({ field }) => {
    if (!field.isList) {
        return null;
    }

    return <PredefinedValuesList field={field} />;
});

interface PredefinedValuesListProps {
    field: IObjectFieldVM;
}

const PredefinedValuesList = observer(({ field }: PredefinedValuesListProps) => {
    const hasItems = field.items.length > 0;

    return (
        <>
            {hasItems ? (
                <div className={"flex flex-col"}>
                    {field.items.map(item => (
                        <PredefinedValueRow key={item.key} item={item} field={field} />
                    ))}
                    <div className={"flex justify-center mt-md"}>
                        <Button
                            onClick={() => field.addItem()}
                            text={"Add a predefined value"}
                            icon={<AddIcon />}
                            size={"sm"}
                        />
                    </div>
                </div>
            ) : (
                <Grid className={"text-center"}>
                    <Grid.Column span={12}>
                        <Text>There are no predefined values available.</Text>
                    </Grid.Column>
                    <Grid.Column span={12}>
                        <Button onClick={() => field.addItem()} text={"Add a predefined value"} />
                    </Grid.Column>
                </Grid>
            )}
        </>
    );
});

interface PredefinedValueRowProps {
    item: IObjectFieldItemVM;
    field: IObjectFieldVM;
}

const PredefinedValueRow = observer(({ item, field }: PredefinedValueRowProps) => {
    const labelField = item.fields.find(f => f.name === "label");
    const valueField = item.fields.find(f => f.name === "value");
    const selectedField = item.fields.find(f => f.name === "selected");

    return (
        <div className={"mb-md"}>
            <Grid>
                <Grid.Column span={4}>
                    {labelField ? (
                        <Input
                            label={"Label"}
                            value={(labelField.value as string) ?? ""}
                            onChange={v => labelField.onChange(v)}
                        />
                    ) : null}
                </Grid.Column>
                <Grid.Column span={4}>
                    {valueField ? (
                        <Input
                            label={"Value"}
                            value={(valueField.value as string) ?? ""}
                            onChange={v => valueField.onChange(v)}
                        />
                    ) : null}
                </Grid.Column>
                <Grid.Column span={4}>
                    <div className={"flex items-end gap-sm h-full py-sm-plus"}>
                        {selectedField ? (
                            <Switch
                                label={"Selected"}
                                description={"Mark as selected value."}
                                checked={Boolean(selectedField.value)}
                                onChange={v => selectedField.onChange(v)}
                            />
                        ) : null}
                        <IconButton
                            variant={"primary"}
                            size={"sm"}
                            icon={<Icon label={"Add"} icon={<AddIcon />} />}
                            onClick={() => field.addItem()}
                        />
                        <IconButton
                            variant={"secondary"}
                            size={"sm"}
                            icon={<Icon label={"Remove"} icon={<RemoveIcon />} />}
                            onClick={() => item.remove()}
                        />
                    </div>
                </Grid.Column>
            </Grid>
        </div>
    );
});
