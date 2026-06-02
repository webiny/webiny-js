import React, { useState, useEffect } from "react";
import { makeDecoratable, useDialogs } from "@webiny/app-admin";
import { useRouter } from "@webiny/app";
import { i18n } from "@webiny/app/i18n/index.js";
import { IconButton, OverlayLoader, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as ExpandSidebarIcon } from "@webiny/icons/view_sidebar.svg";
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
    const { data, setData, isPristine } = useModelEditor();
    const router = useRouter();
    const dialogs = useDialogs();

    // Add a class to <body> to trigger global styles while this component is active
    useEffect(() => {
        document.body.classList.add("overflow-hidden");

        return () => {
            document.body.classList.remove("overflow-hidden");
        };
    }, []);

    const isPristineRef = React.useRef(isPristine);
    isPristineRef.current = isPristine;

    useEffect(() => {
        return router.addTransitionGuard({
            guard: () => !isPristineRef.current,
            onBlocked: () => {
                dialogs.showDialog({
                    title: "Confirm Navigation",
                    content: prompt,
                    acceptLabel: "Yes!",
                    cancelLabel: "No, stay here.",
                    onAccept: () => router.confirmTransition(),
                    onClose: () => router.cancelTransition()
                });
            }
        });
    }, []);

    const [activeTab, setActiveTab] = useState<string>("edit");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
            <Header activeTab={activeTab} onTabChange={setActiveTab} />
            <div className={"w-full overflow-y-auto h-main-content"}>
                <div className={"flex h-full"}>
                    <div
                        className={
                            "shrink-0 bg-neutral-base border-r border-neutral-dimmed overflow-hidden h-[calc(100vh-98px)] relative transition-[width] duration-200 ease-in-out"
                        }
                        style={{ width: isSidebarOpen ? 200 : 45 }}
                    >
                        {/* Expanded content */}
                        <div
                            className={
                                "transition-opacity duration-150 " +
                                (isSidebarOpen
                                    ? "opacity-100 delay-75"
                                    : "opacity-0 pointer-events-none")
                            }
                        >
                            <div className={"px-md py-md w-[200px]"}>
                                <FieldsSidebar
                                    onFieldDragStart={() => setActiveTab("edit")}
                                    onCollapse={() => setIsSidebarOpen(false)}
                                />
                            </div>
                        </div>
                        {/* Collapsed strip */}
                        <div
                            className={
                                "absolute inset-0 flex flex-col items-center pt-md gap-md transition-opacity duration-150 " +
                                (!isSidebarOpen
                                    ? "opacity-100 delay-75"
                                    : "opacity-0 pointer-events-none")
                            }
                        >
                            <IconButton
                                variant={"ghost"}
                                size={"xs"}
                                icon={<ExpandSidebarIcon />}
                                onClick={() => setIsSidebarOpen(true)}
                            />
                            <span
                                className={
                                    "text-sm font-semibold text-neutral-primary [writing-mode:vertical-rl] rotate-180"
                                }
                            >
                                Fields
                            </span>
                        </div>
                    </div>
                    <div className={"flex-1 fill-grid overflow-y-scroll h-[calc(100vh-98px)]"}>
                        <div className={"px-xxl py-lg"}>
                            {activeTab === "edit" && (
                                <div
                                    className={"relative mb-lg"}
                                    data-testid={"cms.editor.tab.edit"}
                                >
                                    <Text
                                        as="div"
                                        size={"sm"}
                                        className={"font-semibold text-neutral-primary mb-md"}
                                    >
                                        Model editor
                                    </Text>
                                    <FieldEditor
                                        fields={data.fields}
                                        layout={data.layout || []}
                                        onChange={onChange}
                                    />
                                </div>
                            )}
                            {activeTab === "preview" && (
                                <div data-testid={"cms.editor.tab.preview"}>
                                    <div className={"mb-md"}>
                                        <Tag content={"Preview"} variant={"warning"} />
                                    </div>
                                    <ContentEntryEditorWithConfig>
                                        <ContentEntriesProvider contentModel={data}>
                                            <ContentEntryProvider readonly={true}>
                                                <PreviewTab activeTab={true} />
                                            </ContentEntryProvider>
                                        </ContentEntriesProvider>
                                    </ContentEntryEditorWithConfig>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DragPreview />
            </div>
        </div>
    );
});
