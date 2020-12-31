import React from "react";
import styled from "@emotion/styled";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin
} from "../../../../types";
import ImagesList from "./ImagesList";
import ImagesListImagesSettings from "./ImagesListImagesSettings";
import ImagesListDesignSettings from "./ImagesListDesignSettings";

import { ReactComponent as ImageGalleryIcon } from "./icons/round-photo_library-24px.svg";

export default () => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        margin: "0 auto",
        width: 50,
        svg: {
            width: 50
        }
    });

    return [
        {
            name: "pb-editor-page-element-images-list",
            type: "pb-editor-page-element",
            elementType: "images-list",
            toolbar: {
                title: "Image Gallery",
                group: "pb-editor-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <ImageGalleryIcon />
                        </PreviewBox>
                    );
                }
            },
            settings: ["pb-editor-page-element-settings-delete"],
            target: ["cell", "block"],
            onCreate: "open-settings",
            create(options = {}) {
                return {
                    type: "images-list",
                    data: {
                        component: "mosaic",
                        settings: {
                            margin: {
                                desktop: { all: "0px" },
                                mobile: { all: "0px" }
                            },
                            padding: {
                                desktop: { all: "0px" },
                                mobile: { all: "0px" }
                            }
                        }
                    },
                    ...options
                };
            },
            render({ element }) {
                return <ImagesList data={element.data} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-images-list-filter",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "images-list",
            render(props) {
                return <ImagesListImagesSettings {...props} filter />;
            }
        } as PbEditorPageElementAdvancedSettingsPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-images-list-design",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "images-list",
            render(props) {
                return <ImagesListDesignSettings {...props} />;
            }
        } as PbEditorPageElementAdvancedSettingsPlugin
    ];
};
