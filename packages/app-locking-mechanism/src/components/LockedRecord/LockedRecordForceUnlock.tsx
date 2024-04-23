import React, { useCallback, useEffect } from "react";
import { ILockingMechanismRecord } from "~/types";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import styled from "@emotion/styled";
import { usePermission } from "@webiny/app-headless-cms";
import { useLockingMechanism } from "~/hooks";

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
    const { unlockEntry, error } = useLockingMechanism();
    const { showConfirmation: showForceUnlockConfirmation } = useConfirmationDialog({
        title: "Force unlock an entry",
        message: `You are about to forcefully unlock the "${record.meta.title}" entry. Are you sure you want to continue?`
    });
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        if (!error?.message) {
            return;
        }
        console.error(error);
        showSnackbar(error.message);
    }, [error?.message]);

    const onClick = useCallback(() => {
        showForceUnlockConfirmation(async () => {
            await unlockEntry(record);
        });
    }, [record.id]);

    const { hasFullAccess } = usePermission();
    if (!hasFullAccess) {
        return null;
    }

    return (
        <Wrapper>
            <Text>
                Because you have a full access to the system, you can force unlock the record.
            </Text>
            <Button onClick={onClick}>Force Unlock</Button>
        </Wrapper>
    );
};
