import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { i18n } from "@webiny/app/i18n";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import RevisionsList from "./ContentEntry/RevisionsList";
import Header from "./ContentEntry/header/Header";
import { useContentEntry } from "./hooks/useContentEntry";
import { ContentEntryForm } from "~/admin/components/ContentEntryForm/ContentEntryForm";

const t = i18n.namespace("app-headless-cms/admin/content-model-entries/details");

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

const ContentEntry = () => {
    const {
        contentModel,
        loading,
        entry,
        showEmptyView,
        canCreate,
        createEntry,
        setTabsRef,
        setFormRef
    } = useContentEntry();

    // Render "No content selected" view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display entry details {message}`({
                    message: canCreate ? "or create a..." : ""
                })}
                action={
                    canCreate ? (
                        <ButtonDefault data-testid="new-record-button" onClick={createEntry}>
                            <ButtonIcon icon={<AddIcon />} /> {t`New Entry`}
                        </ButtonDefault>
                    ) : null
                }
            />
        );
    }

    return (
        <DetailsContainer>
            <test-id data-testid="cms-content-details">
                <Tabs ref={tabs => setTabsRef(tabs)}>
                    <Tab label={"Content"} disabled={loading}>
                        <RenderBlock>
                            <Elevation z={2} className={elevationStyles}>
                                {loading && <CircularProgress />}
                                <Header />
                                <ContentEntryForm
                                    contentModel={contentModel}
                                    entry={entry}
                                    onForm={form => setFormRef(form)}
                                />
                            </Elevation>
                        </RenderBlock>
                    </Tab>
                    <Tab label={"Revisions"} disabled={loading}>
                        <RevisionsList />
                    </Tab>
                </Tabs>
            </test-id>
        </DetailsContainer>
    );
};

export default ContentEntry;
