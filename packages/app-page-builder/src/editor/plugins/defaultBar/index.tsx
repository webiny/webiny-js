import React from "react";
import { PbEditorDefaultBarRightPageOptionsPlugin, PbEditorDefaultBarRightPlugin } from "~/types";
import PublishPageButton from "./components/PublishPageButton";
import PreviewPageButton from "./components/PreviewPageButton";
import SetAsHomepageButton from "./components/SetAsHomepageButton";
import PageOptionsMenu from "./components/PageOptionsMenu";
import Divider from "./components/Divider";
import Revisions from "./components/Revisions";

export default [
    {
        name: "pb-editor-default-bar-right-revisions-select",
        type: "pb-editor-default-bar-right",
        render() {
            return <Revisions />;
        }
    } as PbEditorDefaultBarRightPlugin,
    {
        name: "pb-editor-default-bar-right-revisions-divider",
        type: "pb-editor-default-bar-right",
        render() {
            return <Divider />;
        }
    } as PbEditorDefaultBarRightPlugin,
    {
        name: "pb-editor-default-bar-right-page-options",
        type: "pb-editor-default-bar-right",
        render() {
            return <PageOptionsMenu />;
        }
    } as PbEditorDefaultBarRightPlugin,
    {
        name: "pb-editor-default-bar-right-page-options-preview",
        type: "pb-editor-default-bar-right-page-options",
        render() {
            return <PreviewPageButton />;
        }
    } as PbEditorDefaultBarRightPageOptionsPlugin,
    {
        name: "pb-editor-default-bar-right-page-options-set-as-homepage",
        type: "pb-editor-default-bar-right-page-options",
        render() {
            return <SetAsHomepageButton />;
        }
    } as PbEditorDefaultBarRightPageOptionsPlugin,
    {
        name: "pb-editor-default-bar-right-publish-button",
        type: "pb-editor-default-bar-right",
        render() {
            return <PublishPageButton />;
        }
    } as PbEditorDefaultBarRightPlugin
];
