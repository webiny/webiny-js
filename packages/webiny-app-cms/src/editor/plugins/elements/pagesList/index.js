// @flow
import React from "react";
import type { ElementPluginType } from "webiny-app-cms/types";
import { Tab } from "webiny-ui/Tabs";
import { ReactComponent as DesignIcon } from "./icons/round-style-24px.svg";
import { ReactComponent as FilterIcon } from "./icons/round-filter_list-24px.svg";
import { ReactComponent as PageListIcon } from "./page-list-icon.svg";
import PagesList from "./PagesList";
import PagesListFilterSettings from "./PagesListFilterSettings";
import PagesListDesignSettings from "./PagesListDesignSettings";
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
            name: "cms-element-pages-list",
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
                    type: "cms-element-pages-list",
                    data: {
                        limit: 3,
                        component: "cms-element-pages-list-component-default",
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
                return <PagesList data={element.data} />;
            }
        }: ElementPluginType),
        {
            name: "cms-element-advanced-settings-pages-list-filter",
            type: "cms-element-advanced-settings",
            element: "cms-element-pages-list",
            render(props: Object) {
                return (
                    <Tab icon={<FilterIcon />} label="Filter">
                        <PagesListFilterSettings {...props} filter />
                    </Tab>
                );
            }
        },
        {
            name: "cms-element-advanced-settings-pages-list-design",
            type: "cms-element-advanced-settings",
            element: "cms-element-pages-list",
            render(props: Object) {
                return (
                    <Tab icon={<DesignIcon />} label="Design">
                        <PagesListDesignSettings {...props} design />
                    </Tab>
                );
            }
        }
    ];
};
