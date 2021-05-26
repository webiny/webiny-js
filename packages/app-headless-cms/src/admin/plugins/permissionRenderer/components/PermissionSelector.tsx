import React, { Fragment } from "react";
import { i18n } from "@webiny/app/i18n";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import { Cell } from "@webiny/ui/Grid";
import { BindComponent } from "@webiny/form";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export type PermissionSelectorCheckList = {
    id: string;
    name: string;
};

type Model = {
    id: string;
    label: string;
    [key: string]: any;
};

type Group = {
    id: string;
    label: string;
    [key: string]: any;
};

type RenderItemsProps = {
    onChange: Function;
    getValue: Function;
    items: Model[] | Group[];
};

export type PermissionSelectorProps = {
    Bind: BindComponent;
    selectorKey: string;
    locales: string[];
    entity: string;
    getItems: (code: string) => Model[] | Group[];
    RenderItems?: React.FunctionComponent<RenderItemsProps>;
};

const DefaultRenderItems = ({ items, getValue, onChange }: RenderItemsProps) => {
    return (
        <React.Fragment>
            {items.map(({ id, label }) => (
                <div key={id}>
                    <Checkbox key={id} label={label} value={getValue(id)} onChange={onChange(id)} />
                </div>
            ))}
        </React.Fragment>
    );
};

export const PermissionSelector = ({
    Bind,
    entity,
    locales,
    selectorKey,
    getItems,
    RenderItems = DefaultRenderItems
}: PermissionSelectorProps) => {
    const description = t`Select the {selectorKey} user will be allowed to access.`({
        selectorKey
    });

    return (
        <Fragment>
            {locales.map(code => {
                const items = getItems(code);

                return (
                    <Bind key={code} name={`${entity}Props.${selectorKey}.${code}`}>
                        {items.length && (
                            <CheckboxGroup label={code}>
                                {({ onChange, getValue }) => (
                                    <RenderItems
                                        items={items}
                                        onChange={onChange}
                                        getValue={getValue}
                                    />
                                )}
                            </CheckboxGroup>
                        )}
                    </Bind>
                );
            })}
            <FormElementMessage>{description}</FormElementMessage>
        </Fragment>
    );
};

export const PermissionSelectorWrapper = ({ children }) => (
    <Fragment>
        <Cell span={1} />
        <Cell span={11}>{children}</Cell>
    </Fragment>
);
