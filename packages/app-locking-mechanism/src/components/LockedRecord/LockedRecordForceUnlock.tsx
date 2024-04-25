import React, { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { ILockingMechanismError, ILockingMechanismRecord } from "~/types";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useLockingMechanism, usePermission } from "~/hooks";
import { useRouter } from "@webiny/react-router";
import { useContentEntriesList } from "@webiny/app-headless-cms";

const Wrapper = styled("div")({
    padding: "20px",
    backgroundColor: "white"
});

const Text = styled("p")({});

const Button = styled("button")({});

export interface ILockedRecordForceUnlock {
    record: ILockingMechanismRecord;
}

export const LockedRecordForceUnlock = ({ record }: ILockedRecordForceUnlock) => {
    const { unlockEntryForce } = useLockingMechanism();

    const { navigateTo } = useContentEntriesList();
    const { showConfirmation: showForceUnlockConfirmation } = useConfirmationDialog({
        title: "Force unlock an entry",
        message: `You are about to forcefully unlock the "${record.meta.title}" entry. Are you sure you want to continue?`
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
            <Button onClick={onClick}>Unlock and go back</Button>
        </Wrapper>
    );
};
