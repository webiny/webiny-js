import React, { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { ILockingMechanismError, ILockingMechanismRecord } from "~/types";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useLockingMechanism, usePermission } from "~/hooks";
import { useRouter } from "@webiny/react-router";
import { useContentEntriesList } from "@webiny/app-headless-cms";
import { Alert } from "@webiny/ui/Alert";
import { ButtonPrimary } from "@webiny/ui/Button";

const Wrapper = styled("div")({
    padding: "0",
    backgroundColor: "white"
});

const Text = styled("p")({
    lineHeight: "125%"
});

const Bold = styled("span")({
    fontWeight: 600
});

export interface ILockedRecordForceUnlock {
    record: ILockingMechanismRecord;
}

const ErrorMessage = ({ record }: ILockedRecordForceUnlock) => {
    return (
        <div>
            <Alert type="warning" title="Warning">
                <Bold>{record.$locked?.lockedBy.displayName || "Unknown user"}</Bold> is currently
                editing this record.
                <br /> If you force unlock it, they could potentially lose their changes.
            </Alert>
            <br />
            <p>
                You are about to forcefully unlock the <Bold>{record.title}</Bold> entry.
            </p>
            <p>Are you sure you want to continue?</p>
        </div>
    );
};

export const LockedRecordForceUnlock = ({ record }: ILockedRecordForceUnlock) => {
    const { unlockEntryForce } = useLockingMechanism();

    const { navigateTo } = useContentEntriesList();
    const { showConfirmation: showForceUnlockConfirmation } = useConfirmationDialog({
        title: "Force unlock the entry",
        message: <ErrorMessage record={record} />
    });
    const { showSnackbar } = useSnackbar();

    const { history } = useRouter();

    const [error, setError] = useState<ILockingMechanismError>();

    useEffect(() => {
        if (!error?.message) {
            return;
        }
        console.error(error);
        showSnackbar(error.message);
    }, [error?.message]);

    const onClick = useCallback(() => {
        showForceUnlockConfirmation(async () => {
            const result = await unlockEntryForce(record);
            if (!result.error) {
                navigateTo();
                return;
            }
            setError(result.error);
        });
    }, [record.id, history, navigateTo]);

    const { hasFullAccess } = usePermission();
    if (!hasFullAccess) {
        return null;
    }

    return (
        <Wrapper>
            <Text>
                Because you have a full access to the system, you can force unlock the record.
            </Text>
            <br />
            <ButtonPrimary onClick={onClick}>Unlock and go back</ButtonPrimary>
        </Wrapper>
    );
};
