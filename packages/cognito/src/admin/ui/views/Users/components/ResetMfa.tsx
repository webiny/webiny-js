import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import {
    createReactiveComponent,
    useAuthentication,
    useConfirmationDialog
} from "@webiny/app-admin";
import { Button, Grid, Text, useToast } from "@webiny/admin-ui";
import { ResetMfaFeature } from "~/admin/presentation/users/ResetMfa/feature.js";
import {
    RESET_MFA_TITLE,
    RESET_MFA_WARNING
} from "~/admin/presentation/users/ResetMfa/ResetMfaPresenter.js";
import type { ResetMfaUser } from "~/admin/presentation/users/ResetMfa/abstractions.js";

export interface ResetMfaProps {
    user: ResetMfaUser;
}

/**
 * Lets an administrator reset the MFA of a user who lost access to their authenticator app.
 * Render it with `key={user.id}`, so it starts over for each user.
 */
export const ResetMfa = createReactiveComponent(({ user }: ResetMfaProps) => {
    const { identity } = useAuthentication();
    const { presenter } = useFeature(ResetMfaFeature);
    const toast = useToast();
    const { showConfirmation } = useConfirmationDialog({
        title: RESET_MFA_TITLE,
        message: RESET_MFA_WARNING,
        acceptLabel: "Reset MFA",
        dataTestId: "users.reset-mfa-dialog"
    });

    useEffect(() => {
        presenter.init({ user, currentIdentityId: identity?.id });
    }, [user, identity?.id]);

    if (!presenter.vm.available) {
        return null;
    }

    const onClick = () => {
        showConfirmation(async () => {
            const result = await presenter.reset();
            if (result.type === "reset") {
                toast.showSuccessToast({ title: result.message });
            } else {
                toast.showWarningToast({
                    title: "Error resetting MFA",
                    description: result.message,
                    duration: Infinity
                });
            }
        });
    };

    return (
        <Grid.Column span={12}>
            <div className={"flex items-center justify-between gap-md"}>
                <div>
                    <Text as={"div"} size={"md"}>
                        Multi-factor authentication
                    </Text>
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                        If the user lost access to their authenticator app, reset MFA so they set it
                        up again on their next sign-in.
                    </Text>
                </div>
                <Button
                    variant={"secondary"}
                    text={"Reset MFA"}
                    disabled={presenter.vm.resetting}
                    onClick={onClick}
                    data-testid={"users.reset-mfa"}
                />
            </div>
        </Grid.Column>
    );
});
