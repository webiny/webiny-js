import React from "react";
import { get } from "lodash";
import PageSettings from "./components/PageSettings";
import PageSettingsButton from "./components/PageSettingsButton";
import PublishPageButton from "./components/PublishPageButton";
import PreviewPageButton from "./components/PreviewPageButton";
import SetAsHomepageButton from "./components/SetAsHomepageButton";
import PageOptionsMenu from "./components/PageOptionsMenu";
import Divider from "./components/Divider";
import Title from "./components/Title";
import BackButton from "./components/BackButton";
import Revisions from "./components/Revisions";
import {
    PbEditorBarPlugin, PbEditorDefaultBarLeftPlugin, PbEditorDefaultBarRightPageOptionsPlugin,
    PbEditorDefaultBarRightPlugin
} from "@webiny/app-page-builder/admin/types";

export default [
    {
        name: "pb-editor-page-settings-bar",
        type: "pb-editor-bar",
        shouldRender({ plugins }) {
            const active = get(plugins, "pb-editor-bar");
            return active ? active.find(pl => pl.name === "pb-editor-page-settings-bar") : false;
        },
        render() {
            return <PageSettings />;
        }
    } as PbEditorBarPlugin,
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
        name: "pb-editor-default-bar-right-page-settings-button",
        type: "pb-editor-default-bar-right",
        render() {
            return <PageSettingsButton />;
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
    } as PbEditorDefaultBarRightPlugin,

    {
        name: "pb-editor-default-bar-left-back-button",
        type: "pb-editor-default-bar-left",
        render() {
            return <BackButton />;
        }
    } as PbEditorDefaultBarLeftPlugin,
    {
        name: "pb-editor-default-bar-left-divider",
        type: "pb-editor-default-bar-left",
        render() {
            return <Divider />;
        }
    } as PbEditorDefaultBarLeftPlugin,
    {
        name: "pb-editor-default-bar-left-title",
        type: "pb-editor-default-bar-left",
        render() {
            return <Title />;
        }
    } as PbEditorDefaultBarLeftPlugin
];
