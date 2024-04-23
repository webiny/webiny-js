import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import RevisionsList from "./ContentEntry/RevisionsList";
import { useContentEntry } from "./hooks/useContentEntry";
import { ContentEntryForm } from "~/admin/components/ContentEntryForm/ContentEntryForm";
import { makeDecoratable } from "@webiny/app";

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
    /*overflow: "scroll",*/
    padding: 25
});

const elevationStyles = css({
    position: "relative"
});

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "test-id": {
                children?: React.ReactNode;
            };
        }
    }
}

const DefaultContentEntry = () => {
    const { loading, entry, activeTab, setActiveTab, setFormRef } = useContentEntry();

    return (
        <DetailsContainer>
            <test-id data-testid="cms-content-details">
                <Tabs value={activeTab} onActivate={setActiveTab}>
                    <Tab
                        label={"Content"}
                        disabled={loading}
                        data-testid={"cms.content-form.tabs.content"}
                    >
                        <RenderBlock>
                            <Elevation z={2} className={elevationStyles}>
                                {loading && <CircularProgress />}
                                <ContentEntryForm
                                    entry={entry}
                                    onForm={form => setFormRef(form)}
                                    addEntryToListCache={true}
                                />
                            </Elevation>
                        </RenderBlock>
                    </Tab>
                    <Tab
                        label={"Revisions"}
                        disabled={loading}
                        data-testid={"cms.content-form.tabs.revisions"}
                    >
                        <RevisionsList />
                    </Tab>
                </Tabs>
            </test-id>
        </DetailsContainer>
    );
};

export const ContentEntry = makeDecoratable("ContentEntry", DefaultContentEntry);
