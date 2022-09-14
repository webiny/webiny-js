import React, { ComponentProps } from "react";
import { ApolloClient } from "apollo-client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { makeComposable } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Prompt } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { ReactComponent as FormIcon } from "@material-design-icons/svg/round/assignment.svg";
import { FieldsList, Field } from "./components/FieldsList";
import { FieldEditor } from "./components/FieldEditor";
import { PreviewTab } from "./components/PreviewTab";
import { Header } from "./components/Header";
import { DragPreview } from "./components/DragPreview";
import { useContentModelEditor } from "./hooks/useContentModelEditor";
import { CmsEditorField, CmsEditorFieldsLayout, CmsEditorFieldTypePlugin } from "~/types";
import { ContentModelEditorProvider } from "./Context";

const t = i18n.ns("app-headless-cms/admin/editor");

const prompt = t`There are some unsaved changes! Are you sure you want to navigate away and discard all changes?`;

const ContentContainer = styled("div")({
    paddingTop: 65
});

const EditContainer = styled("div")({
    padding: 40,
    position: "relative"
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

const Sidebar = makeComposable<ComponentProps<typeof LeftPanel>>(
    "Sidebar",
    ({ children, ...props }) => {
        return (
            <LeftPanel span={4} {...props}>
                {children}
            </LeftPanel>
        );
    }
);

const Content = makeComposable<ComponentProps<typeof RightPanel>>(
    "Content",
    ({ children, ...props }) => {
        return (
            <RightPanel span={8} {...props}>
                {children}
            </RightPanel>
        );
    }
);

const ContentTab = makeComposable<ComponentProps<typeof Tab>>(
    "ContentTab",
    ({ children, ...props }) => {
        return <Tab {...props}>{children}</Tab>;
    }
);

const ContentTabs = makeComposable<ComponentProps<typeof Tabs>>(
    "ContentTabs",
    ({ children, ...props }) => {
        const { tabsRef, setActiveTabIndex } = useContentModelEditor();

        return (
            <Tabs
                className={formTabs}
                ref={tabsRef}
                onActivate={e => setActiveTabIndex(e)}
                {...props}
            >
                {children}
            </Tabs>
        );
    }
);

interface EditorProps {
    modelId: string;
    apolloClient: ApolloClient<any>;
}

export type Editor = React.FC<EditorProps> & {
    Header: typeof Header;
    Sidebar: typeof Sidebar;
    Content: typeof Content;
    ContentTab: typeof ContentTab;
    ContentTabs: typeof ContentTabs;
    Field: typeof Field;
    FieldsList: typeof FieldsList;
};

const BaseEditor = () => {
    const { data, setData, isPristine, tabsRef, activeTabIndex } = useContentModelEditor();

    const onChange = ({ fields, layout }: OnChangeParams) => {
        setData(data => ({ ...data, fields, layout }));
    };

    if (!data) {
        return <CircularProgress label={"Loading content model..."} />;
    }

    const baseFields = plugins
        .byType<CmsEditorFieldTypePlugin>("cms-editor-field-type")
        .filter(pl => !pl.tags?.includes("type:contentModel"));

    return (
        <div className={"content-model-editor"}>
            <Prompt when={!isPristine} message={prompt} />
            <Header />
            <ContentContainer>
                <SplitView>
                    <Sidebar>
                        <FieldsList
                            icon={<FormIcon />}
                            title={"Fields"}
                            fieldTypePlugins={baseFields}
                            onFieldDragStart={() => {
                                if (!tabsRef.current) {
                                    return;
                                }
                                tabsRef.current.switchTab(0);
                            }}
                        />
                    </Sidebar>
                    <Content>
                        <ContentTabs>
                            <ContentTab label={"Edit"} data-testid={"cms.editor.tab.edit"}>
                                <EditContainer>
                                    <FieldEditor
                                        fields={data.fields}
                                        layout={data.layout || []}
                                        onChange={onChange}
                                    />
                                </EditContainer>
                            </ContentTab>
                            <ContentTab label={"Preview"} data-testid={"cms.editor.tab.preview"}>
                                <PreviewTab activeTab={activeTabIndex === 1} />
                            </ContentTab>
                        </ContentTabs>
                    </Content>
                </SplitView>
            </ContentContainer>
            <DragPreview />
        </div>
    );
};

const EditorComponent: React.FC<EditorProps> = ({ modelId, apolloClient }) => {
    return (
        <ContentModelEditorProvider key={modelId} apolloClient={apolloClient} modelId={modelId}>
            <DndProvider backend={HTML5Backend}>
                <BaseEditor />
            </DndProvider>
        </ContentModelEditorProvider>
    );
};

export const Editor: Editor = Object.assign(EditorComponent, {
    Content,
    ContentTab,
    ContentTabs,
    Header,
    Sidebar,
    Field,
    FieldsList
});
