import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Grid } from "@webiny/admin-ui";
import type { UserFormPresenter } from "~/admin/presentation/users/UserForm/abstractions.js";

interface LinkAccountAlertProps {
    presenter: UserFormPresenter.Interface;
    isNewUser: boolean;
}

export const LinkAccountAlert = createReactiveComponent(
    ({ presenter, isNewUser }: LinkAccountAlertProps) => {
        if (!isNewUser || presenter.vm.mode !== "link") {
            return null;
        }

        return (
            <Grid className={"mb-lg"}>
                <Grid.Column span={12}>
                    <Alert type={"info"} title={"Account in another tenant"}>
                        This email already has an account in another tenant. Link it to give this
                        person access here. They keep their name and password.
                    </Alert>
                </Grid.Column>
            </Grid>
        );
    }
);
