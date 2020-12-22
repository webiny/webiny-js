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
};

type Group = {
    id: string;
    label: string;
};

export type PermissionSelectorProps = {
    Bind: BindComponent;
    selectorKey: string;
    locales: string[];
    entity: string;
    cmsData: {
        [locale: string]: {
            models: Model[];
            groups: Group[];
        };
    };
};

export const PermissionSelector = ({
    Bind,
    entity,
    locales,
    selectorKey,
    cmsData
}: PermissionSelectorProps) => {
    const description = t`Select the {selectorKey} user will be allowed to access.`({
        selectorKey
    });

    return (
        <Fragment>
            {locales.map(code => (
                <Bind key={code} name={`${entity}Props.${selectorKey}.${code}`}>
                    {cmsData[code][selectorKey].length && (
                        <CheckboxGroup label={code}>
                            {({ onChange, getValue }) => (
                                <React.Fragment>
                                    {cmsData[code][selectorKey].map(({ id, label }) => (
                                        <Checkbox
                                            key={id}
                                            label={label}
                                            value={getValue(id)}
                                            onChange={onChange(id)}
                                        />
                                    ))}
                                </React.Fragment>
                            )}
                        </CheckboxGroup>
                    )}
                </Bind>
            ))}
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
