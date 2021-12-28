import React, { Fragment, useEffect, useMemo } from "react";
import { nanoid } from "nanoid";
import { AddQuerySelectionPlugin } from "@webiny/app/plugins/AddQuerySelectionPlugin";
import { plugins } from "@webiny/plugins";
import { Compose } from "@webiny/app-admin";
import { TenantFormFields } from "./TenantFormFields";
import { DocumentNode } from "graphql";

interface AddTenantSettingsFieldProps {
    querySelection: DocumentNode;
    element: JSX.Element;
}

const createFieldsHOC = (element: JSX.Element) => {
    return Component => {
        return function FieldHOC() {
            return (
                <Fragment>
                    <Component />
                    {element}
                </Fragment>
            );
        };
    };
};

export const AddTenantFormField = ({ querySelection, element }: AddTenantSettingsFieldProps) => {
    const FieldHOC = useMemo(() => createFieldsHOC(element), []);

    useEffect(() => {
        const plugin = new AddQuerySelectionPlugin({
            operationName: "GetTenant",
            selectionPath: "tenancy.getTenant.data",
            addSelection: querySelection
        });

        plugin.name = nanoid();
        plugins.register(plugin);

        return () => plugins.unregister(plugin.name);
    }, []);

    return <Compose component={TenantFormFields} with={FieldHOC} />;
};
