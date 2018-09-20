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
        name: "cms-page-settings-bar",
        type: "cms-editor-bar",
        shouldRender({ state }: { state: Object }) {
            return getActivePlugin("cms-editor-bar")(state) === "cms-page-settings-bar";
        },

        render() {
            return <PageSettings />;
        }
    },
    {
        name: "revisions-select",
        type: "cms-default-bar-right",
        render() {
            return <Revisions />;
        }
    },
    {
        name: "revisions-divider",
        type: "cms-default-bar-right",
        render() {
            return <Divider />;
        }
    },
    {
        name: "cms-page-settings-button",
        type: "cms-default-bar-right",
        render() {
            return <PageSettingsButton />;
        }
    },
    {
        name: "more-actions-button",
        type: "cms-default-bar-right",
        render() {
            return <IconButton icon={<MoreVerticalIcon />} />;
        }
    },
    {
        name: "publish-button",
        type: "cms-default-bar-right",
        render() {
            return <ButtonPrimary>Publish</ButtonPrimary>;
        }
    },
    {
        name: "preview-select",
        type: "cms-default-bar-center",
        render() {
            return <Preview />;
        }
    },
    {
        name: "back-button",
        type: "cms-default-bar-left",
        render() {
            return <BackButton />;
        }
    },
    {
        name: "divider",
        type: "cms-default-bar-left",
        render() {
            return <Divider />;
        }
    },
    {
        name: "cms-page-title",
        type: "cms-default-bar-left",
        render() {
            return <Title />;
        }
    }
];
