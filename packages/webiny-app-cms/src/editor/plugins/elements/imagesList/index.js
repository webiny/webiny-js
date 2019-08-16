// @flow
import React from "react";
import type { ElementPluginType } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import ImagesList from "./ImagesList";
import ImagesListImagesSettings from "./ImagesListImagesSettings";
import ImagesListDesignSettings from "./ImagesListDesignSettings";
import styled from "react-emotion";

import { ReactComponent as DesignIcon } from "./icons/round-style-24px.svg";
import { ReactComponent as ImageGalleryIcon } from "./icons/round-photo_library-24px.svg";
import { ReactComponent as ImagesIcon } from "webiny-app-cms/admin/assets/round-photo_library-24px.svg";

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
        ({
            name: "pb-page-element-images-list",
            type: "pb-page-element",
            elementType: "images-list",
            toolbar: {
                title: "Image Gallery",
                group: "pb-page-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <ImageGalleryIcon />
                        </PreviewBox>
                    );
                }
            },
            settings: ["pb-page-element-settings-delete"],
            target: ["pb-page-element-row", "pb-page-element-column"],
            onCreate: "open-settings",
            create(options = {}) {
                return {
                    type: "pb-page-element-images-list",
                    data: {
                        component: "pb-page-element-images-list-component-mosaic",
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
        }: ElementPluginType),
        {
            name: "pb-page-element-advanced-settings-images-list-filter",
            type: "pb-page-element-advanced-settings",
            element: "pb-page-element-images-list",
            render(props: Object) {
                return (
                    <Tab icon={<ImagesIcon />} label="Images">
                        <ImagesListImagesSettings {...props} filter />
                    </Tab>
                );
            }
        },
        {
            name: "pb-page-element-advanced-settings-images-list-design",
            type: "pb-page-element-advanced-settings",
            element: "pb-page-element-images-list",
            render(props: Object) {
                return (
                    <Tab icon={<DesignIcon />} label="Design">
                        <ImagesListDesignSettings {...props} design />
                    </Tab>
                );
            }
        }
    ];
};
