import React from "react";
import styled from "@emotion/styled";
import { Elevation as BaseElevation } from "@webiny/ui/Elevation";
import { useLockingMechanism } from "~/hooks";
import { useContentEntry } from "@webiny/app-headless-cms";

const StyledWrapper = styled("div")({
    width: "50%",
    margin: "100px auto 0 auto",
    backgroundColor: "var(--mdc-theme-surface)"
});

interface IWrapperProps {
    children: React.ReactNode;
}

const Wrapper = ({ children }: IWrapperProps) => {
    return (
        <StyledWrapper>
            <Elevation z={2}>{children}</Elevation>
        </StyledWrapper>
    );
};

const StyledTitle = styled("h3")({
    fontSize: 24,
    marginBottom: "10px",
    fontWeight: "normal",
    " > em": {
        fontStyle: "italic"
    }
});

const Title = () => {
    const { entry } = useContentEntry();
    return (
        <StyledTitle>
            The entry <em>{entry.meta.title}</em> is locked!
        </StyledTitle>
    );
};

const Text = styled("p")({
    fontSize: 16,
    marginBottom: "10px"
});

const Details = styled("p")({
    fontSize: 14
});

const Elevation = styled(BaseElevation)({
    padding: "20px"
});

export interface ILockedRecordProps {
    id: string;
}

export const LockedRecord = ({ id }: ILockedRecordProps) => {
    const { getLockRecordEntry } = useLockingMechanism();

    const record = getLockRecordEntry(id);
    if (!record?.$locked?.lockedBy) {
        return (
            <Wrapper>
                <Title />
                <Text>
                    This record is locked, but cannot find the actual locking record. Something must
                    be wrong - use the GraphQL API in the API Playground to find out what is wrong,
                    and unlock the entry manually.
                </Text>
            </Wrapper>
        );
    }
    return (
        <Wrapper>
            <Title />
            <Text>
                It is locked by <strong>{record.$locked.lockedBy.displayName}</strong>.
            </Text>
            <Details>
                You can either contact the user and ask them to unlock the record, or you can wait
                for the lock to expire.
            </Details>
        </Wrapper>
    );
};
