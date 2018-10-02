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
        name: "cms-default-bar-publish-button",
        type: "cms-default-bar-right",
        render() {
            return <ButtonPrimary>Publish</ButtonPrimary>;
        }
    },
    /*{
        name: "cms-default-bar-preview-select",
        type: "cms-default-bar-center",
        render() {
            return <Preview />;
        }
    },*/
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
