import React from "react";
import { useModel } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { ReactComponent as DisableIcon } from "@webiny/icons/power_off.svg";
import { TenantCell } from "./TenantEntryList/TenantCell.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";
import type { TenantEntry } from "~/admin/types.js";
import { useDisableTenantDialog } from "~/admin/TenantEntryList/DisableTenant/useDisableTenantDialog.js";
import { TenantNameCell } from "~/admin/TenantEntryList/TenantNameCell.js";

const { Browser } = ContentEntryListConfig;
const EntryAction = Browser.Entry.Action;
const { useTableRow } = Browser.Table.Column;

interface WithDisableActionProps {
    children: React.ReactNode;
}

const WithDisableAction = ({ children }: WithDisableActionProps) => {
    // useTableRow() allows you to access the entire data of the current row.
    const { row } = useTableRow<TenantEntry>();
    const { disableEntry } = useDisableTenantDialog({ record: row.data });

    if (row.data.values.status === "enabled") {
        return (
            <EntryAction.OptionsMenuItem
                icon={<DisableIcon />}
                label={"Disable"}
                onAction={disableEntry}
                data-testid={"aco.actions.entry.delete"}
                variant={"destructive"}
            />
        );
    }

    return <>{children}</>;
};

const DeleteActionDecorator = EntryAction.createDecorator(Original => {
    return function DeleteAction(props) {
        const { model } = useModel();

        if (model.modelId !== TENANT_MODEL_ID) {
            return <Original {...props} />;
        }

        if (props.name === "delete") {
            return (
                <Original
                    {...props}
                    element={<WithDisableAction>{props.element}</WithDisableAction>}
                />
            );
        }

        return <Original {...props} />;
    };
});

export const TenantEntryList = () => {
    return (
        <>
            <DeleteActionDecorator />
            <ContentEntryListConfig>
                <Browser.Table.Column
                    hideable={false}
                    name={"name"}
                    header={"Name"}
                    modelIds={[TENANT_MODEL_ID]}
                    cell={<TenantNameCell />}
                />
                <Browser.Table.Column
                    name={"tenant"}
                    header={"Tenant"}
                    modelIds={[TENANT_MODEL_ID]}
                    cell={<TenantCell />}
                    before={"actions"}
                />
            </ContentEntryListConfig>
        </>
    );
};
