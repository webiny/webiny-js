//@flow
import React from "react";
import { get } from "lodash";
import PageSettings from "./components/PageSettings";
import PageSettingsButton from "./components/PageSettingsButton";
import PublishPageButton from "./components/PublishPageButton";
import PreviewPageButton from "./components/PreviewPageButton";
import PageOptionsMenu from "./components/PageOptionsMenu";
import Divider from "./components/Divider";
import Title from "./components/Title";
import BackButton from "./components/BackButton";
import Revisions from "./components/Revisions";

export default [
    {
        name: "cms-page-settings-bar",
        type: "cms-editor-bar",
        shouldRender({ plugins }: Object) {
            const active = get(plugins, "cms-editor-bar");
            return active ? active.find(pl => pl.name === "cms-page-settings-bar") : false;
        },
        render() {
            return <PageSettings />;
        }
    },
    {
        name: "cms-default-bar-right-revisions-select",
        type: "cms-default-bar-right",
        render() {
            return <Revisions />;
        }
    },
    {
        name: "cms-default-bar-right-revisions-divider",
        type: "cms-default-bar-right",
        render() {
            return <Divider />;
        }
    },
    {
        name: "cms-default-bar-right-page-settings-button",
        type: "cms-default-bar-right",
        render() {
            return <PageSettingsButton />;
        }
    },
    [
        {
            name: "cms-default-bar-right-page-options",
            type: "cms-default-bar-right",
            render() {
                return <PageOptionsMenu />;
            }
        },
        {
            name: "cms-default-bar-right-page-options-preview",
            type: "cms-default-bar-right-page-options-option",
            render() {
                return <PreviewPageButton />;
            }
        }
    ],
    {
        name: "cms-default-bar-right-publish-button",
        type: "cms-default-bar-right",
        render() {
            return <PublishPageButton />;
        }
    },

    {
        name: "cms-default-bar-left-back-button",
        type: "cms-default-bar-left",
        render() {
            return <BackButton />;
        }
    },
    {
        name: "cms-default-bar-left-divider",
        type: "cms-default-bar-left",
        render() {
            return <Divider />;
        }
    },
    {
        name: "cms-default-bar-left-title",
        type: "cms-default-bar-left",
        render() {
            return <Title />;
        }
    }
];
