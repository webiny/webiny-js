import React from "react";
import styled from "@emotion/styled";
import { Grid, OverlayLoader } from "@webiny/admin-ui";
import { ContentEntryForm } from "~/admin/components/ContentEntryForm/ContentEntryForm.js";
import { makeDecoratable } from "@webiny/app";
import { useSingletonContentEntry } from "../hooks/useSingletonContentEntry.js";
import type { PartialCmsContentEntryWithId } from "~/admin/contexts/Cms/index.js";
import { SingletonHeader } from "~/admin/components/ContentEntryForm/SingletonHeader/index.js";

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
            <div className={"container py-lg"}>
                <Grid>
                    <Grid.Column span={10} offset={1}>
                        <div className="border-sm border-neutral-dimmed-darker rounded-t-3xl rounded-b-3xl">
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
