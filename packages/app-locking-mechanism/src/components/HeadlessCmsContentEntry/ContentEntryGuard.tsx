import { useContentEntry } from "@webiny/app-headless-cms";
import { useLockingMechanism } from "~/hooks";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import { css } from "emotion";
import styled from "@emotion/styled";
import React, { useEffect, useState } from "react";
import { LockedRecord } from "../LockedRecord";

const DetailsContainer = styled("div")({
    height: "calc(100% - 10px)",
    overflow: "hidden",
    position: "relative",
    nav: {
        backgroundColor: "var(--mdc-theme-surface)"
    }
});

const RenderBlock = styled("div")({
    position: "relative",
    zIndex: 0,
    backgroundColor: "var(--mdc-theme-background)",
    height: "100%",
    padding: 25
});

const elevationStyles = css({
    position: "relative",
    height: "100%"
});

export interface IContentEntryGuardProps {
    children: React.ReactElement;
}

export const ContentEntryGuard = (props: IContentEntryGuardProps) => {
    const { loading, entry, contentModel: model } = useContentEntry();
    const { children } = props;
    const { fetchIsEntryLocked } = useLockingMechanism();

    const [locked, setLocked] = useState<boolean | undefined>();

    useEffect(() => {
        if (!entry.id || loading || locked !== undefined) {
            return;
        }
        (async () => {
            const result = await fetchIsEntryLocked({
                id: entry.id,
                $lockingType: model.modelId
            });
            setLocked(result);
        })();
    }, [entry.id, loading]);

    if (locked === undefined || loading) {
        return (
            <DetailsContainer>
                <RenderBlock>
                    <Elevation z={2} className={elevationStyles}>
                        <CircularProgress />
                    </Elevation>
                </RenderBlock>
            </DetailsContainer>
        );
    } else if (locked) {
        return <LockedRecord id={entry.id} />;
    }

    return children;
};
