// @flow
import React from "react";
import type { ElementPluginType } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import { ReactComponent as DesignIcon } from "./icons/round-style-24px.svg";
import { ReactComponent as PageListIcon } from "./image-list-icon.svg";
import { ReactComponent as ImagesIcon } from "webiny-app-cms/admin/assets/round-photo_library-24px.svg";
import ImagesList from "./ImagesList";
import ImagesListImagesSettings from "./ImagesListImagesSettings";
import ImagesListDesignSettings from "./ImagesListDesignSettings";
import styled from "react-emotion";

export default () => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        margin: "0 auto",
        width: 100,
        svg: {
            width: 100
        }
    });

    return [
        ({
            name: "cms-element-images-list",
            type: "cms-element",
            toolbar: {
                title: "List of pages",
                group: "cms-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <PageListIcon />
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
                        limit: 3,
                        component: "default",
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
