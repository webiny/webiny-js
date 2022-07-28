import React, { useEffect } from "react";
import { ContentReviewStatus } from "./ContentReviewStatus";
import { BackButton } from "./BackButton";
import { Divider } from "./Divider";
import { Name } from "./Name";
import { plugins } from "@webiny/plugins";

const defaultBaPlugins = [
    {
        name: "content-review-editor-default-bar-right-divider",
        type: "content-review-editor-default-bar-right",
        render() {
            return <Divider />;
        }
    },
    {
        name: "content-review-editor-default-bar-right-status",
        type: "content-review-editor-default-bar-right",
        render() {
            return <ContentReviewStatus />;
        }
    },
    {
        name: "content-review-editor-default-bar-left-back-button",
        type: "content-review-editor-default-bar-left",
        render() {
            return <BackButton />;
        }
    },
    {
        name: "content-review-editor-default-bar-left-divider",
        type: "content-review-editor-default-bar-left",
        render() {
            return <Divider />;
        }
    },
    {
        name: "content-review-editor-default-bar-left-name",
        type: "content-review-editor-default-bar-left",
        render() {
            return <Name />;
        }
    }
];

export const DefaultBar: React.FC = () => {
    useEffect(() => {
        plugins.register(defaultBaPlugins);
    }, []);
    return null;
};
