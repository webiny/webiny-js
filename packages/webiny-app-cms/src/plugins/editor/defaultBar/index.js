//@flow
import React from "react";
import { IconButton, ButtonPrimary } from "webiny-ui/Button";
import { getActivePlugin } from "webiny-app-cms/editor/selectors";
import PageSettings from "./PageSettings";
import PageSettingsButton from "./PageSettingsButton";
import Divider from "./Divider";
import Title from "./Title";
import BackButton from "./BackButton";
import Revisions from "./Revisions";
import Preview from "./Preview";
import { ReactComponent as MoreVerticalIcon } from "webiny-app-cms/editor/assets/icons/more_vert.svg";

export default [
    {
        name: "page-settings-bar",
        type: "editor-bar",
        shouldRender({ state }: { state: Object }) {
            return getActivePlugin("editor-bar")(state) === "page-settings-bar";
        },

        render() {
            return <PageSettings />;
        }
    },
    {
        name: "revisions-select",
        type: "default-bar-right",
        render() {
            return <Revisions />;
        }
    },
    {
        name: "revisions-divider",
        type: "default-bar-right",
        render() {
            return <Divider />;
        }
    },
    {
        name: "page-settings-button",
        type: "default-bar-right",
        render() {
            return <PageSettingsButton />;
        }
    },
    {
        name: "more-actions-button",
        type: "default-bar-right",
        render() {
            return <IconButton icon={<MoreVerticalIcon />} />;
        }
    },
    {
        name: "publish-button",
        type: "default-bar-right",
        render() {
            return <ButtonPrimary>Publish</ButtonPrimary>;
        }
    },
    {
        name: "preview-select",
        type: "default-bar-center",
        render() {
            return <Preview />;
        }
    },
    {
        name: "back-button",
        type: "default-bar-left",
        render() {
            return <BackButton />;
        }
    },
    {
        name: "divider",
        type: "default-bar-left",
        render() {
            return <Divider />;
        }
    },
    {
        name: "page-title",
        type: "default-bar-left",
        render() {
            return <Title />;
        }
    }
];
