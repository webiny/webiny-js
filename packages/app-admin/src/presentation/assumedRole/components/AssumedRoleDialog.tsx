import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Alert, Dialog, OverlayLoader, Select, Text } from "@webiny/admin-ui";
import { useDialog } from "~/hooks/useDialog.js";
import { AssumedRolePresenterFeature } from "../feature.js";
import type { AssumedRolePresenter } from "../abstractions.js";

export const ASSUMED_ROLE_DIALOG = "assumed-role";

const buildOptions = (vm: AssumedRolePresenter.ViewModel) => {
    const options = [{ label: "Roles", options: vm.roleOptions }];

    if (vm.teamOptions.length > 0) {
        options.push({ label: "Teams", options: vm.teamOptions });
    }

    return options;
};

export const AssumedRoleDialog = observer(() => {
    const { closeDialog } = useDialog();
    const { presenter } = useFeature(AssumedRolePresenterFeature);
    const vm = presenter.vm;

    const [selected, setSelected] = useState<string | undefined>(undefined);

    useEffect(() => {
        presenter.load();
    }, [presenter]);

    const confirm = async () => {
        if (!selected) {
            return;
        }

        await presenter.assume(selected);

        if (!presenter.vm.error) {
            closeDialog();
        }
    };

    return (
        <Dialog
            open={true}
            onClose={closeDialog}
            title={"View as"}
            actions={
                <>
                    <Dialog.CancelAction onClick={closeDialog} text={"Cancel"} />
                    <Dialog.ConfirmAction
                        onClick={confirm}
                        text={"Start preview"}
                        disabled={!selected || vm.switching}
                    />
                </>
            }
        >
            {vm.loading ? <OverlayLoader text={"Loading roles..."} /> : null}
            {vm.switching ? <OverlayLoader text={"Switching..."} /> : null}

            <div className={"flex flex-col gap-md"}>
                <Text as={"div"}>
                    Browse the Admin with the permissions of a role or team. Lists, actions and
                    writes are all enforced by the API, so you see exactly what they would.
                </Text>

                {vm.error ? (
                    <Alert type={"danger"} variant={"subtle"}>
                        {vm.error}
                    </Alert>
                ) : null}

                <Select
                    label={"Role or team"}
                    placeholder={"Pick one"}
                    value={selected}
                    onChange={setSelected}
                    options={buildOptions(vm)}
                />
            </div>
        </Dialog>
    );
});
