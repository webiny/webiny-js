import React from "react";
import styled from "@emotion/styled";
import { Elevation as BaseElevation } from "@webiny/ui/Elevation";
import { useRecordLocking } from "~/hooks";
import { useContentEntry } from "@webiny/app-headless-cms";
import { LockedRecordForceUnlock } from "./LockedRecordForceUnlock";
import { ReactComponent as LockIcon } from "@material-design-icons/svg/outlined/lock.svg";
import { IRecordLockingLockRecord } from "~/types";

const StyledWrapper = styled("div")({
    width: "50%",
    margin: "100px auto 0 auto",
    backgroundColor: "var(--mdc-theme-surface)"
});

const InnerWrapper = styled("div")({
    display: "flex"
});

const Content = styled("div")({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
});

const IconBox = styled("div")({
    width: 250,
    height: 250,
    marginRight: 25,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    backgroundColor: "var(--mdc-theme-background)",
    svg: {
        width: 150,
        height: 150,
        lineHeight: "100%",
        display: "block",
        fill: "var(--mdc-theme-primary)"
    }
});

const Bold = styled("span")({
    fontWeight: 600
});

interface IWrapperProps {
    children: React.ReactNode;
}

const Wrapper = ({ children }: IWrapperProps) => {
    return (
        <StyledWrapper>
            <Elevation z={2}>
                <InnerWrapper>
                    <IconBox>
                        <LockIcon />
                    </IconBox>
                    <Content>{children}</Content>
                </InnerWrapper>
            </Elevation>
        </StyledWrapper>
    );
};

const StyledTitle = styled("h3")({
    fontSize: 24,
    marginBottom: "10px",
    fontWeight: "600",
    " > em": {
        fontStyle: "italic"
    }
});

const Title = () => {
    const { entry } = useContentEntry();
    return <StyledTitle>Record ({entry.meta.title}) is locked!</StyledTitle>;
};

const Text = styled("p")({
    fontSize: 16,
    marginBottom: "10px",
    lineHeight: "125%"
});

const Elevation = styled(BaseElevation)({
    padding: "20px"
});

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
                    record lock.
                </Text>
                <Text>A force-unlock is required to regain edit capabilities for this record.</Text>
                <LockedRecordForceUnlock
                    id={lockRecordEntry.id}
                    type={record.$lockingType}
                    title={record.meta.title}
                />
            </Wrapper>
        );
    }
    return (
        <Wrapper>
            <Title />
            <Text>
                It is locked because <Bold>{lockRecordEntry.lockedBy.displayName}</Bold> is
                currently editing this record.
            </Text>
            <Text>
                You can either contact the user and ask them to unlock the record, or you can wait
                for the lock to expire.
            </Text>
            <LockedRecordForceUnlock
                id={lockRecordEntry.id}
                type={record.$lockingType}
                lockedBy={lockRecordEntry.lockedBy}
                title={record.meta.title}
            />
        </Wrapper>
    );
};
