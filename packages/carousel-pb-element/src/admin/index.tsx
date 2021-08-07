import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import {
    PbEditorPageElementPlugin,
    PbEditorElementPluginArgs
} from "@webiny/app-page-builder/types";
import { createElement } from "@webiny/app-page-builder/editor/helpers";
import CarouselGridContainer from "~/admin/components/CarouselGridContainer";

export const createDefaultCells = () => {
    const cells = [12];
    return cells.map(size => {
        return createElement("cell", {
            data: {
                settings: {
                    grid: {
                        size
                    }
                }
            }
        });
    });
};

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default (args: PbEditorElementPluginArgs = {}): PbEditorPageElementPlugin => {
    const defaultSettings = [
        "pb-editor-page-element-style-settings-carousel",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ];

    const elementType = kebabCase(args.elementType || "carousel");

    const defaultToolbar = {
        title: "Carousel",
        group: "pb-editor-element-group-layout",
        preview() {
            return (
                <PreviewBox>
                    <span>Carousel</span>
                </PreviewBox>
            );
        }
    };

    return {
        type: "pb-editor-page-element",
        name: `pb-editor-page-element-${elementType}`,
        elementType: elementType,
        toolbar: typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
        settings:
            typeof args.settings === "function" ? args.settings(defaultSettings) : defaultSettings,

        target: ["cell", "block"],
        canDelete: () => {
            return true;
        },
        create: (options = {}) => {
            const defaultValue = {
                type: elementType,
                elements: options.elements || createDefaultCells(),
                data: {
                    settings: {}
                },
                ...options
            };

            return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
        },
        render({ element }) {
            return <CarouselGridContainer element={element} />;
        }
    };
};
