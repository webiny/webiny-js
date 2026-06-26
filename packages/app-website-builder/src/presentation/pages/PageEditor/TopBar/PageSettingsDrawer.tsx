import React from "react";
import { observer } from "mobx-react-lite";
import { FormView } from "@webiny/app-admin";
import { Drawer } from "@webiny/admin-ui";
import type { PageSettingsPresenter } from "~/presentation/pages/PageEditor/PageSettings/index.js";

export interface PageSettingsDrawerProps {
    presenter: PageSettingsPresenter.Interface;
    open: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const PageSettingsDrawer = observer(
    ({ presenter, open, onClose, onSave }: PageSettingsDrawerProps) => {
        const vm = presenter.vm;

        return (
            <Drawer
                open={open}
                onClose={onClose}
                modal={true}
                width={900}
                bodyPadding={false}
                title={"Page Settings"}
                actions={
                    <>
                        <Drawer.CancelButton text={"Cancel"} />
                        <Drawer.ConfirmButton onClick={onSave} text={"Save Settings"} />
                    </>
                }
                headerSeparator={true}
                footerSeparator={true}
                className={"flex flex-col"}
            >
                {vm.error ? (
                    <div className="text-destructive-default text-sm p-md">{vm.error}</div>
                ) : null}
                {vm.form ? <FormView name="Page Settings" form={vm.form} /> : null}
            </Drawer>
        );
    }
);
