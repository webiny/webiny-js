import React, { Fragment, memo, useMemo } from "react";
import { AddGraphQLQuerySelection, Compose } from "@webiny/app-admin";
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

export const AddTenantFormField = memo(function AddTenantFormField({
    querySelection,
    element
}: AddTenantSettingsFieldProps) {
    const FieldHOC = useMemo(() => createFieldsHOC(element), []);

    return (
        <Fragment>
            <AddGraphQLQuerySelection
                operationName={"GetTenant"}
                selectionPath={"tenancy.getTenant.data"}
                addSelection={querySelection}
            />
            <Compose component={TenantFormFields} with={FieldHOC} />
        </Fragment>
    );
});
