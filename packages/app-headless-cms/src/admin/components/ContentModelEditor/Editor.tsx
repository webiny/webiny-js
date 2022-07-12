import React, { useRef, useState } from "react";
import { Prompt } from "@webiny/react-router";
import styled from "@emotion/styled";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { Tab, Tabs, TabsImperativeApi } from "@webiny/ui/Tabs";
import { ReactComponent as FormIcon } from "./icons/round-assignment-24px.svg";
import { FieldsSidebar } from "./FieldsSidebar";
import { FieldEditor } from "../FieldEditor";
import { PreviewTab } from "./PreviewTab";
import Header from "./Header";
import DragPreview from "../DragPreview";
import { useContentModelEditor } from "./useContentModelEditor";
import { CmsEditorField, CmsEditorFieldsLayout } from "~/types";

const t = i18n.ns("app-headless-cms/admin/editor");

const prompt = t`There are some unsaved changes! Are you sure you want to navigate away and discard all changes?`;

const ContentContainer = styled("div")({
    paddingTop: 65
});

export const EditContainer = styled("div")({
    padding: 40,
    position: "relative"
});

const LeftBarTitle = styled("div")({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    display: "flex",
    alignItems: "center",
    padding: 25,
    color: "var(--mdc-theme-on-surface)"
});

const titleIcon = css({
    height: 24,
    marginRight: 15,
    color: "var(--mdc-theme-primary)"
});

const LeftBarFieldList = styled("div")({
    padding: 40,
    overflow: "auto",
    height: "calc(100vh - 250px)"
});

const formTabs = css({
    "&.webiny-ui-tabs": {
        ".webiny-ui-tabs__tab-bar": {
            backgroundColor: "var(--mdc-theme-surface)"
        }
    }
});

interface OnChangeParams {
    fields: CmsEditorField[];
    layout: CmsEditorFieldsLayout;
}

export const Editor: React.FC = () => {
    const { data, setData, isPristine } = useContentModelEditor();

    const tabsRef = useRef<TabsImperativeApi>();
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

    const onChange = ({ fields, layout }: OnChangeParams) => {
        setData(data => ({ ...data, fields, layout }));
    };

    if (!data) {
        return <CircularProgress label={"Loading content model..."} />;
    }

    return (
        <div className={"content-model-editor"}>
            <Prompt when={!isPristine} message={prompt} />
            <Header />
            <ContentContainer>
                <SplitView>
                    <LeftPanel span={4}>
                        <LeftBarTitle>
                            <Icon className={titleIcon} icon={<FormIcon />} />
                            <Typography use={"headline6"}>Fields</Typography>
                        </LeftBarTitle>
                        <LeftBarFieldList>
                            <FieldsSidebar
                                onFieldDragStart={() => {
                                    if (!tabsRef.current) {
                                        return;
                                    }
                                    tabsRef.current.switchTab(0);
                                }}
                            />
                        </LeftBarFieldList>
                    </LeftPanel>
                    <RightPanel span={8}>
                        <Tabs
                            className={formTabs}
                            ref={tabsRef}
                            onActivate={e => setActiveTabIndex(e)}
                        >
                            <Tab label={"Edit"} data-testid={"cms.editor.tab.edit"}>
                                <EditContainer>
                                    <FieldEditor
                                        fields={data.fields}
                                        layout={data.layout || []}
                                        onChange={onChange}
                                    />
                                </EditContainer>
                            </Tab>
                            <Tab label={"Preview"} data-testid={"cms.editor.tab.preview"}>
                                <PreviewTab activeTab={activeTabIndex === 1} />
                            </Tab>
                        </Tabs>
                    </RightPanel>
                </SplitView>
            </ContentContainer>
            <DragPreview />
        </div>
    );
};
