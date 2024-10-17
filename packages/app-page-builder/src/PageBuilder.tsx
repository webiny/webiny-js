import React, { Fragment } from "react";
import { HasPermission } from "@webiny/app-security";
import { Plugins, AddMenu as Menu, createProviderPlugin } from "@webiny/app-admin";
import { Global, css } from "@emotion/react";
import { PageBuilderProvider as ContextProvider } from "./contexts/PageBuilder";
import { ReactComponent as PagesIcon } from "./admin/assets/table_chart-24px.svg";
import { WebsiteSettings } from "./modules/WebsiteSettings/WebsiteSettings";
import { AdminPageBuilderContextProvider } from "~/admin/contexts/AdminPageBuilder";
import { DefaultOnPagePublish } from "~/admin/plugins/pageDetails/pageRevisions/DefaultOnPagePublish";
import { DefaultOnPageUnpublish } from "~/admin/plugins/pageDetails/pageRevisions/DefaultOnPageUnpublish";
import { DefaultOnPageDelete } from "~/admin/plugins/pageDetails/pageRevisions/DefaultOnPageDelete";
import { EditorProps, EditorRenderer } from "./admin/components/Editor";
import { PagesModule } from "~/admin/views/Pages/PagesModule";
import { AddButtonLinkComponent } from "~/elementDecorators/AddButtonLinkComponent";
import { AddButtonClickHandlers } from "~/elementDecorators/AddButtonClickHandlers";
import { InjectElementVariables } from "~/render/variables/InjectElementVariables";
import { LexicalParagraphRenderer } from "~/render/plugins/elements/paragraph/LexicalParagraph";
import { LexicalHeadingRenderer } from "~/render/plugins/elements/heading/LexicalHeading";

export type { EditorProps };
export { EditorRenderer };
export * from "~/admin/config/pages";
export * from "~/admin/views/Pages/hooks";

const PageBuilderProviderPlugin = createProviderPlugin(Component => {
    return function PageBuilderProvider({ children }) {
        return (
            <ContextProvider>
                <AdminPageBuilderContextProvider>
                    <Component>{children}</Component>
                </AdminPageBuilderContextProvider>
            </ContextProvider>
        );
    };
});

const PageBuilderMenu = () => {
    return (
        <>
            <HasPermission any={["pb.menu", "pb.category", "pb.page", "pb.template", "pb.block"]}>
                <Menu name="pageBuilder" label={"Page Builder"} icon={<PagesIcon />}>
                    <Menu name="pageBuilder.pages" label={"Pages"}>
                        <HasPermission name={"pb.category"}>
                            <Menu
                                name="pageBuilder.pages.categories"
                                label={"Categories"}
                                path="/page-builder/categories"
                            />
                        </HasPermission>
                        <HasPermission name={"pb.page"}>
                            <Menu
                                name="pageBuilder.pages.pages"
                                label={"Pages"}
                                path="/page-builder/pages"
                            />
                        </HasPermission>
                        <HasPermission name={"pb.template"}>
                            <Menu
                                name="pageBuilder.pages.pageTemplates"
                                label={"Templates"}
                                path="/page-builder/page-templates"
                            />
                        </HasPermission>
                        <HasPermission name={"pb.menu"}>
                            <Menu
                                name="pageBuilder.pages.menus"
                                label={"Menus"}
                                path="/page-builder/menus"
                            />
                        </HasPermission>
                    </Menu>
                    <Menu name="pageBuilder.blocks" label={"Blocks"}>
                        <HasPermission name={"pb.block"}>
                            <Menu
                                name="pageBuilder.blocks.categories"
                                label={"Categories"}
                                path="/page-builder/block-categories"
                            />
                            <Menu
                                name="pageBuilder.blocks.pageBlocks"
                                label={"Blocks"}
                                path="/page-builder/page-blocks"
                            />
                        </HasPermission>
                    </Menu>
                </Menu>
            </HasPermission>
            <HasPermission name={"pb.settings"}>
                <Menu name={"settings"}>
                    <Menu name={"settings.pageBuilder"} label={"Page Builder"}>
                        <Menu
                            name={"settings.pageBuilder.website"}
                            label={"Website"}
                            path={"/settings/page-builder/website"}
                        />
                    </Menu>
                </Menu>
            </HasPermission>
        </>
    );
};

const EditorLoader = React.lazy(() =>
    import(
        /* webpackChunkName: "PageBuilderEditor" */
        "./editor/Editor"
    ).then(m => ({
        default: m.Editor
    }))
);

const EditorRendererPlugin = EditorRenderer.createDecorator(() => {
    return function Editor(props) {
        return <EditorLoader {...props} />;
    };
});

const displayContents = css`
    pb-editor-ui-elements,
    pb-editor-ui-element {
        display: contents;
    }
`;

export const PageBuilder = () => {
    return (
        <Fragment>
            <Global styles={displayContents} />
            <PagesModule />
            <PageBuilderProviderPlugin />
            <EditorRendererPlugin />
            <Plugins>
                <PageBuilderMenu />
                <WebsiteSettings />
                <DefaultOnPagePublish />
                <DefaultOnPageUnpublish />
                <DefaultOnPageDelete />
            </Plugins>
            {/* Element renderer plugins. */}
            <LexicalParagraphRenderer />
            <LexicalHeadingRenderer />
            <AddButtonLinkComponent />
            <AddButtonClickHandlers />
            <InjectElementVariables />
        </Fragment>
    );
};
