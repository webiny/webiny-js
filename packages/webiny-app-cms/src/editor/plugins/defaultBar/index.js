//@flow
import React from "react";
import { get } from "lodash";
import { IconButton } from "webiny-ui/Button";
import PageSettings from "./components/PageSettings";
import PageSettingsButton from "./components/PageSettingsButton";
import PublishPageButton from "./components/PublishPageButton";
import PreviewPageButton from "./components/PreviewPageButton";
import Divider from "./components/Divider";
import Title from "./components/Title";
import BackButton from "./components/BackButton";
import Revisions from "./components/Revisions";
import { ReactComponent as MoreVerticalIcon } from "webiny-app-cms/editor/assets/icons/more_vert.svg";

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
        name: "cms-default-bar-revisions-select",
        type: "cms-default-bar-right",
        render() {
            return <Revisions />;
        }
    },
    {
        name: "cms-default-bar-revisions-divider",
        type: "cms-default-bar-right",
        render() {
            return <Divider />;
        }
    },
    {
        name: "cms-default-bar-page-settings-button",
        type: "cms-default-bar-right",
        render() {
            return <PageSettingsButton />;
        }
    },
    {
        name: "cms-default-bar-more-actions-button",
        type: "cms-default-bar-right",
        render() {
            return <IconButton icon={<MoreVerticalIcon />} />;
        }
    },
    {
        name: "cms-default-bar-preview-button",
        type: "cms-default-bar-right",
        render() {
            return <PreviewPageButton />;
        }
    },
    {
        name: "cms-default-bar-publish-button",
        type: "cms-default-bar-right",
        render() {
            return <PublishPageButton />;
        }
    },

    {
        name: "cms-default-bar-back-button",
        type: "cms-default-bar-left",
        render() {
            return <BackButton />;
        }
    },
    {
        name: "cms-default-bar-divider",
        type: "cms-default-bar-left",
        render() {
            return <Divider />;
        }
    },
    {
        name: "cms-default-bar-title",
        type: "cms-default-bar-left",
        render() {
            return <Title />;
        }
    }
];
