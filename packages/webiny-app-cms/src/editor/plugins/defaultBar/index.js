//@flow
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

export default [
    {
        name: "pb-editor-page-settings-bar",
        type: "pb-editor-bar",
        shouldRender({ plugins }: Object) {
            const active = get(plugins, "pb-editor-bar");
            return active ? active.find(pl => pl.name === "pb-page-settings-bar") : false;
        },
        render() {
            return <PageSettings />;
        }
    },
    {
        name: "pb-editor-default-bar-right-revisions-select",
        type: "pb-editor-default-bar-right",
        render() {
            return <Revisions />;
        }
    },
    {
        name: "pb-editor-default-bar-right-revisions-divider",
        type: "pb-editor-default-bar-right",
        render() {
            return <Divider />;
        }
    },
    {
        name: "pb-editor-default-bar-right-page-settings-button",
        type: "pb-editor-default-bar-right",
        render() {
            return <PageSettingsButton />;
        }
    },
    [
        {
            name: "pb-editor-default-bar-right-page-options",
            type: "pb-editor-default-bar-right",
            render() {
                return <PageOptionsMenu />;
            }
        },
        {
            name: "pb-editor-default-bar-right-page-options-preview",
            type: "pb-editor-default-bar-right-page-options-option",
            render() {
                return <PreviewPageButton />;
            }
        },
        {
            name: "pb-editor-default-bar-right-page-options-set-as-homepage",
            type: "pb-editor-default-bar-right-page-options-option",
            render() {
                return <SetAsHomepageButton />;
            }
        }
    ],
    {
        name: "pb-editor-default-bar-right-publish-button",
        type: "pb-editor-default-bar-right",
        render() {
            return <PublishPageButton />;
        }
    },

    {
        name: "pb-editor-default-bar-left-back-button",
        type: "pb-editor-default-bar-left",
        render() {
            return <BackButton />;
        }
    },
    {
        name: "pb-editor-default-bar-left-divider",
        type: "pb-editor-default-bar-left",
        render() {
            return <Divider />;
        }
    },
    {
        name: "pb-editor-default-bar-left-title",
        type: "pb-editor-default-bar-left",
        render() {
            return <Title />;
        }
    }
];
