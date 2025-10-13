import React from "react";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { Grid, Heading, Icon, Text } from "@webiny/admin-ui";
import { useRecordLocking } from "~/hooks/index.js";
import { useContentEntry } from "@webiny/app-headless-cms";
import { LockedRecordForceUnlock } from "./LockedRecordForceUnlock.js";
import type { IRecordLockingLockRecord } from "~/types.js";

interface IWrapperProps {
    children: React.ReactNode;
}

const Wrapper = ({ children }: IWrapperProps) => {
    return (
        <>
            <div className="w-5/12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                <div
                    className={
                        "flex p-lg border-sm border-neutral-dimmed-darker rounded-3xl  bg-neutral-base"
                    }
                >
                    <Grid>
                        <Grid.Column span={3}>
                            <div className="h-full flex items-center justify-center bg-neutral-dimmed rounded-md p-lg">
                                <Icon
                                    style={{
                                        width: "64px",
                                        height: "64px"
                                    }}
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
            {/*<div className="absolute inset-0 bg-neutral-dark/50 z-45"></div>*/}
        </>
    );
};

const Title = () => {
    const { entry } = useContentEntry();
    return (
        <Heading level={4} className={"mb-sm"}>
            Record ({entry.meta.title}) is locked!
        </Heading>
    );
};

export interface ILockedRecordProps {
    record: IRecordLockingLockRecord;
}

export const LockedRecord = ({ record: lockRecordEntry }: ILockedRecordProps) => {
    const { getLockRecordEntry } = useRecordLocking();

    const record = getLockRecordEntry(lockRecordEntry.id);

    if (!record) {
        return (
            <Wrapper>
                <Text>Could not find the lock record. Please refresh the Admin UI.</Text>
            </Wrapper>
        );
    } else if (!lockRecordEntry?.lockedBy) {
        return (
            <Wrapper>
                <Title />
                <Text>
                    This record is locked, but the system cannot find the user that created the
                    record lock. A force-unlock is required to regain editing capabilities for this
                    record.
                </Text>
                <LockedRecordForceUnlock
                    id={lockRecordEntry.id}
                    type={record.$lockingType}
                    title={record.data.meta.title}
                />
            </Wrapper>
        );
    }
    return (
        <Wrapper>
            <Title />
            <Text>
                It is locked because <strong>{lockRecordEntry.lockedBy.displayName}</strong> is
                currently editing this record. You can either contact the user and ask them to
                unlock the record, or you can wait for the lock to expire.
            </Text>
            <LockedRecordForceUnlock
                id={lockRecordEntry.id}
                type={record.$lockingType}
                lockedBy={lockRecordEntry.lockedBy}
                title={record.data.meta.title}
            />
        </Wrapper>
    );
};
