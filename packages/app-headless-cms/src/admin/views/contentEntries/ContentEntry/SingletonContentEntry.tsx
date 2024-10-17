import React from "react";
import styled from "@emotion/styled";
import { Elevation as BaseElevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import { ContentEntryForm } from "~/admin/components/ContentEntryForm/ContentEntryForm";
import { makeDecoratable } from "@webiny/app";
import { useSingletonContentEntry } from "../hooks/useSingletonContentEntry";
import { PartialCmsContentEntryWithId } from "~/admin/contexts/Cms";
import { SingletonHeader } from "~/admin/components/ContentEntryForm/SingletonHeader";

const Elevation = styled(BaseElevation)`
    height: 100%;
    flex: 0 0 50%;
`;

const Container = styled.div`
    display: flex;
    padding: 25px;
    justify-content: center;
`;

export const SingletonContentEntry = makeDecoratable("SingletonContentEntry", () => {
    const { loading, entry, updateEntry, contentModel } = useSingletonContentEntry();

    return (
        <Container>
            <Elevation z={2}>
                {loading && <CircularProgress />}
                <ContentEntryForm
                    header={<SingletonHeader title={contentModel.name} />}
                    entry={entry}
                    persistEntry={entry =>
                        updateEntry({ entry: entry as PartialCmsContentEntryWithId })
                    }
                />
            </Elevation>
        </Container>
    );
});
