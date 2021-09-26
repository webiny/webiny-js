import React from "react";
import styled from "@emotion/styled";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { ReactComponent as WorldIcon } from "./assets/world.svg";
import { SpaceX } from "../website";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50,
        color: "var(--mdc-theme-text-secondary-on-background)"
    }
});

export default {
    name: "pb-editor-page-element-space-x",
    type: "pb-editor-page-element",
    elementType: "spaceX",
    toolbar: {
        // We use `pb-editor-element-group-media` to put our plugin into the Media group.
        title: "SpaceX",
        group: "pb-editor-element-group-media",
        preview() {
            return (
                <PreviewBox>
                    <WorldIcon />
                </PreviewBox>
            );
        }
    },
    settings: [
        "pb-editor-page-element-settings-delete",
        "pb-editor-page-element-settings-visibility",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin"
    ],
    target: ["cell", "block"],
    onCreate: "open-settings",
    create(options) {
        /*
            Create function is here to create the initial data
            for the page element, which then is utilized in the
            example page element component and in the settings dialog.
        */
        return {
            type: "spaceX",
            elements: [],
            data: {
                // Arguments used upon issuing the initial GraphQL query.
                initialGqlQueryVariables: {
                    limit: 10,
                    offset: 0,
                    type: "rockets"
                },
                // Initial data to be passed to the component.
                // Populated upon fetching the page via GraphQL API, from the website.
                initialGqlQueryData: null,
                settings: {}
            },
            ...options
        };
    },
    render({ element }) {
        /*
            Every render function receives the page element's
            data assigned to the "element.data" property in
            the received props.
        */
        return <SpaceX element={element} />;
    }
} as PbEditorPageElementPlugin;
