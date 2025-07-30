import React from "react";
import styled from "@emotion/styled";
import { Grid, OverlayLoader } from "@webiny/admin-ui";
import { ContentEntryForm } from "~/admin/components/ContentEntryForm/ContentEntryForm";
import { makeDecoratable } from "@webiny/app";
import { useSingletonContentEntry } from "../hooks/useSingletonContentEntry";
import type { PartialCmsContentEntryWithId } from "~/admin/contexts/Cms";
import { SingletonHeader } from "~/admin/components/ContentEntryForm/SingletonHeader";

const Container = styled.div`
    // This is a workaround for the fact that the ContentEntryForm component is used by many views.
    // It has no padding, so we need to override it here.
    #cms-content-form {
        padding: var(--padding-lg);
`;

export const SingletonContentEntry = makeDecoratable("SingletonContentEntry", () => {
    const { loading, entry, updateEntry, contentModel } = useSingletonContentEntry();

    return (
        <Container>
            <div className={"wby-container wby-py-lg"}>
                <Grid>
                    <Grid.Column span={10} offset={1}>
                        <div className="wby-border-sm wby-border-neutral-dimmed-darker wby-rounded-t-3xl wby-rounded-b-3xl">
                            {loading && <OverlayLoader />}
                            <ContentEntryForm
                                header={<SingletonHeader title={contentModel.name} />}
                                entry={entry}
                                persistEntry={entry =>
                                    updateEntry({ entry: entry as PartialCmsContentEntryWithId })
                                }
                            />
                        </div>
                    </Grid.Column>
                </Grid>
            </div>
        </Container>
    );
});
