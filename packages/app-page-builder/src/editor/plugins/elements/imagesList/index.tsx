import React from "react";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin
} from "@webiny/app-page-builder/admin/types";
import { Tab } from "@webiny/ui/Tabs";
import ImagesList from "./ImagesList";
import ImagesListImagesSettings from "./ImagesListImagesSettings";
import ImagesListDesignSettings from "./ImagesListDesignSettings";
import styled from "@emotion/styled";

import { ReactComponent as DesignIcon } from "./icons/round-style-24px.svg";
import { ReactComponent as ImageGalleryIcon } from "./icons/round-photo_library-24px.svg";
import { ReactComponent as ImagesIcon } from "@webiny/app-page-builder/admin/assets/round-photo_library-24px.svg";

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
            target: ["row", "column"],
            onCreate: "open-settings",
            create(options = {}) {
                return {
                    type: "images-list",
                    data: {
                        component: "mosaic",
                        settings: {
                            margin: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            },
                            padding: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
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
                return (
                    <Tab icon={<ImagesIcon />} label="Images">
                        <ImagesListImagesSettings {...props} filter />
                    </Tab>
                );
            }
        } as PbEditorPageElementAdvancedSettingsPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-images-list-design",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "images-list",
            render(props) {
                return (
                    <Tab icon={<DesignIcon />} label="Design">
                        <ImagesListDesignSettings {...props} />
                    </Tab>
                );
            }
        } as PbEditorPageElementAdvancedSettingsPlugin
    ];
};
