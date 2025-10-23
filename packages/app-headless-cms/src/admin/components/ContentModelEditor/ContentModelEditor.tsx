import React, { useState, useEffect } from "react";
import {
    makeDecoratable,
    NavigationPrompt,
    LeftPanel,
    RightPanel,
    SplitView
} from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import { Heading, OverlayLoader, Separator, Tabs, Text, TimeAgo } from "@webiny/admin-ui";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as PreviewIcon } from "@webiny/icons/fullscreen.svg";
import { FieldsSidebar } from "./FieldsSidebar.js";
import { FieldEditor } from "../FieldEditor/index.js";
import { PreviewTab } from "./PreviewTab.js";
import Header from "./Header.js";
import DragPreview from "../DragPreview.js";
import { useModelEditor } from "./useModelEditor.js";
import type { CmsEditorFieldsLayout, CmsModelField } from "~/types.js";
import { ContentEntryEditorWithConfig } from "~/admin/config/contentEntries/index.js";
import { ContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext.js";
import { ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext.js";
import { ModelIsBeingDeletedError } from "~/admin/components/ContentModelEditor/ModelIsBeingDeletedError/index.js";

const t = i18n.ns("app-headless-cms/admin/editor");

const prompt = t`There are some unsaved changes! Are you sure you want to navigate away and discard all changes?`;

interface OnChangeParams {
    fields: CmsModelField[];
    layout: CmsEditorFieldsLayout;
}

export const ContentModelEditor = makeDecoratable("ContentModelEditor", () => {
    const { data, setData, isPristine, contentModel } = useModelEditor();

    // Add a class to <body> to trigger global styles while this component is active
    useEffect(() => {
        document.body.classList.add("overflow-hidden");

        return () => {
            document.body.classList.remove("overflow-hidden");
        };
    }, []);

    const [activeTab, setActiveTab] = useState<string>("edit");

    const onChange = ({ fields, layout }: OnChangeParams) => {
        setData(data => ({ ...data, fields, layout }));
    };

    if (!data) {
        return <OverlayLoader text={"Loading content model..."} />;
    } else if (data.isBeingDeleted) {
        return <ModelIsBeingDeletedError model={data} />;
    }

    return (
        <div className={"content-model-editor flex-1"}>
            <NavigationPrompt when={!isPristine} message={prompt} />
            <Header />
            <div className={"w-full overflow-y-auto h-main-content"}>
                <SplitView>
                    <LeftPanel span={4} className={"bg-neutral-light"}>
                        <div className={"px-lg py-md"}>
                            <Text
                                as={"div"}
                                className={
                                    "uppercase font-semibold text-neutral-xstrong"
                                }
                            >
                                {"Fields"}
                            </Text>
                        </div>
                        <Separator />
                        <div
                            className={
                                "px-lg py-md h-[calc(100vh-98px)] overflow-y-scroll"
                            }
                        >
                            <FieldsSidebar
                                onFieldDragStart={() => {
                                    setActiveTab("edit");
                                }}
                            />
                        </div>
                    </LeftPanel>
                    <RightPanel span={8} className={"bg-neutral-base"}>
                        <div className={"h-full overflow-y-scroll"}>
                            {contentModel && (
                                <div className={"px-xl pt-lg pb-md-extra"}>
                                    <Heading level={4}>{contentModel.name}</Heading>
                                    <Text size={"sm"} className={"text-neutral-muted"}>
                                        {`Created by ${contentModel.createdBy.displayName}. Last modified: `}
                                        <TimeAgo datetime={contentModel.savedOn} />.
                                    </Text>
                                </div>
                            )}
                            <Tabs
                                size={"md"}
                                spacing={"xl"}
                                separator={true}
                                value={String(activeTab)}
                                onValueChange={setActiveTab}
                                tabs={[
                                    <Tabs.Tab
                                        key={"edit"}
                                        value={"edit"}
                                        trigger={"Edit"}
                                        icon={<EditIcon />}
                                        data-testid={"cms.editor.tab.edit"}
                                        content={
                                            <div className={"relative mb-lg"}>
                                                <FieldEditor
                                                    fields={data.fields}
                                                    layout={data.layout || []}
                                                    onChange={onChange}
                                                />
                                            </div>
                                        }
                                    />,
                                    <Tabs.Tab
                                        key={"preview"}
                                        value={"preview"}
                                        trigger={"Preview"}
                                        icon={<PreviewIcon />}
                                        data-testid={"cms.editor.tab.preview"}
                                        content={
                                            <ContentEntryEditorWithConfig>
                                                <ContentEntriesProvider contentModel={data}>
                                                    <ContentEntryProvider readonly={true}>
                                                        <PreviewTab
                                                            activeTab={activeTab === "preview"}
                                                        />
                                                    </ContentEntryProvider>
                                                </ContentEntriesProvider>
                                            </ContentEntryEditorWithConfig>
                                        }
                                    />
                                ]}
                            />
                        </div>
                    </RightPanel>
                </SplitView>
                <DragPreview />
            </div>
        </div>
    );
});
