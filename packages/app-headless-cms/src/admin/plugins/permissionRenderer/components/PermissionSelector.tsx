import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import type { BindComponent } from "@webiny/form";
import type { PermissionSelectorCmsGroup, PermissionSelectorCmsModel } from "./types.js";
import { CheckboxGroup, FormComponentNote } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

interface RenderItemsProps {
    label: string;
    items: PermissionSelectorCmsModel[] | PermissionSelectorCmsGroup[];
    disabled?: boolean;
    value?: string[];
    onChange?: (values: string[]) => void;
}

const DefaultRenderItems = ({ items, label, disabled, onChange, value }: RenderItemsProps) => {
    return (
        <CheckboxGroup
            label={label}
            value={value}
            onChange={onChange}
            items={items.map(item => {
                return {
                    value: item.id,
                    label: item.label,
                    disabled
                };
            })}
        />
    );
};

export interface PermissionSelectorProps {
    Bind: BindComponent;
    selectorKey: string;
    locales: string[];
    entity: string;
    getItems: (code: string) => PermissionSelectorCmsModel[] | PermissionSelectorCmsGroup[];
    RenderItems?: React.ComponentType<RenderItemsProps>;
    disabled?: boolean;
}

export const PermissionSelector = ({
    Bind,
    entity,
    locales,
    selectorKey,
    getItems,
    RenderItems = DefaultRenderItems,
    disabled
}: PermissionSelectorProps) => {
    const description = t`Select the {selectorKey} user will be allowed to access.`({
        selectorKey
    });

    return (
        <>
            <FormComponentNote text={description} />
            {locales.map(code => {
                const items = getItems(code);

                /**
                 * Lets have two different outputs, depending on if there are any items.
                 * Checkbox group is not showing when no items.
                 */
                if (items.length === 0) {
                    return (
                        <Bind key={code} name={`${entity}Props.${selectorKey}.${code}`}>
                            <></>
                        </Bind>
                    );
                }
                return (
                    <div key={code} className={"mt-md"}>
                        <Bind name={`${entity}Props.${selectorKey}.${code}`}>
                            <RenderItems label={code} items={items} disabled={disabled} />
                        </Bind>
                    </div>
                );
            })}
        </>
    );
};
