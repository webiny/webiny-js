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
            name: "cms-element-images-list",
            type: "cms-element",
            toolbar: {
                title: "Image Gallery",
                group: "cms-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <ImageGalleryIcon />
                        </PreviewBox>
                    );
                }
            },
            settings: ["cms-element-settings-delete"],
            target: ["cms-element-row", "cms-element-column"],
            onCreate: "open-settings",
            create(options = {}) {
                return {
                    type: "cms-element-images-list",
                    data: {
                        component: "cms-element-images-list-component-mosaic",
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
            name: "cms-element-advanced-settings-images-list-filter",
            type: "cms-element-advanced-settings",
            element: "cms-element-images-list",
            render(props: Object) {
                return (
                    <Tab icon={<ImagesIcon />} label="Images">
                        <ImagesListImagesSettings {...props} filter />
                    </Tab>
                );
            }
        },
        {
            name: "cms-element-advanced-settings-images-list-design",
            type: "cms-element-advanced-settings",
            element: "cms-element-images-list",
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
