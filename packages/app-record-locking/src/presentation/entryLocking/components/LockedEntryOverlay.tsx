import React from "react";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { Grid, Heading, Icon, Text } from "@webiny/admin-ui";
import { ForceUnlockButton } from "./ForceUnlockButton.js";
import type { IRecordLockingViewModel } from "../abstractions.js";

interface LockedEntryOverlayProps {
    vm: IRecordLockingViewModel;
    entryTitle?: string;
    onForceUnlock: () => Promise<boolean>;
    onNavigateBack: () => void;
}

export const LockedEntryOverlay = ({
    vm,
    entryTitle,
    onForceUnlock,
    onNavigateBack
}: LockedEntryOverlayProps) => {
    const title = entryTitle ? `Record (${entryTitle}) is locked!` : "Record is locked!";

    if (!vm.lockRecord?.lockedBy) {
        return (
            <Wrapper>
                <Heading level={4} className={"mb-sm"}>
                    {title}
                </Heading>
                <Text>
                    This record is locked, but the system cannot find the user that created the
                    record lock. A force-unlock is required to regain editing capabilities for this
                    record.
                </Text>
                <ForceUnlockButton
                    canForceUnlock={vm.canForceUnlock}
                    lockedBy={null}
                    entryTitle={entryTitle}
                    onForceUnlock={onForceUnlock}
                    onNavigateBack={onNavigateBack}
                />
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <Heading level={4} className={"mb-sm"}>
                {title}
            </Heading>
            <Text>
                It is locked because <strong>{vm.lockedByUserName}</strong> is currently editing
                this record. You can either contact the user and ask them to unlock the record, or
                you can wait for the lock to expire.
            </Text>
            <ForceUnlockButton
                canForceUnlock={vm.canForceUnlock}
                lockedBy={vm.lockRecord.lockedBy}
                entryTitle={entryTitle}
                onForceUnlock={onForceUnlock}
                onNavigateBack={onNavigateBack}
            />
        </Wrapper>
    );
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="w-5/12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <div
                className={
                    "flex p-lg border-sm border-neutral-dimmed-darker rounded-3xl bg-neutral-base"
                }
            >
                <Grid>
                    <Grid.Column span={3}>
                        <div className="h-full flex items-center justify-center bg-neutral-dimmed rounded-md p-lg">
                            <Icon
                                style={{ width: "64px", height: "64px" }}
                                icon={<LockIcon />}
                                label={"Locked Record"}
                                color={"accent"}
                                size={"lg"}
                            />
                        </div>
                    </Grid.Column>
                    <Grid.Column span={9}>
                        <div className={"flex flex-col justify-center"}>{children}</div>
                    </Grid.Column>
                </Grid>
            </div>
        </div>
    );
};
