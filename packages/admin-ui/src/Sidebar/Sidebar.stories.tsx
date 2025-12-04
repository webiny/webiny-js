import React from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { ReactComponent as AuditLogsIcon } from "@webiny/icons/assignment.svg";
import { ReactComponent as FormBuilderIcon } from "@webiny/icons/check_box.svg";
import { ReactComponent as CmsIcon } from "@webiny/icons/web.svg";
import { ReactComponent as PageBuilderIcon } from "@webiny/icons/table_chart.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as ChatIcon } from "@webiny/icons/chat.svg";
import { ReactComponent as GithubIcon } from "@webiny/icons/gite.svg";
import { ReactComponent as DocsIcon } from "@webiny/icons/summarize.svg";
import { ReactComponent as ApiPlaygroundIcon } from "@webiny/icons/swap_horiz.svg";
import { ReactComponent as MoreVertIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as FileManagerIcon } from "@webiny/icons/insert_drive_file.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_4x4.svg";
import { Sidebar } from "./Sidebar.js";
import { SidebarProvider } from "~/Sidebar/components/SidebarProvider.js";
import { DropdownMenu } from "~/DropdownMenu/index.js";
import { Tag } from "~/Tag/index.js";
import { Tooltip } from "~/Tooltip/index.js";

const meta: Meta<typeof Sidebar> = {
    title: "Components/Sidebar",
    component: Sidebar,

    parameters: {
        layout: "fullscreen"
    },

    // We removed this because in the "all stories" view, the menu gets visually
    // broken because of the fixed positioning of the sidebar. This is not a problem
    // when the story is viewed in isolation.
    // tags: ["autodocs"],

    argTypes: {},
    decorators: [
        Story => (
            <Tooltip.Provider>
                <Story />
            </Tooltip.Provider>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

export const MainMenu: Story = {
    render: () => (
        <BrowserRouter>
            <Routes>
                <Route path={"*"} element={<SidebarComponent />} />
            </Routes>
        </BrowserRouter>
    )
};

const SidebarComponent = () => {
    const { hash } = useLocation();

    const [pinnedItems, setPinnedItems] = React.useState<string[]>([]);

    return (
        <SidebarProvider pinnedItems={pinnedItems} onChangePinnedItems={setPinnedItems}>
            <Sidebar
                title={"Webiny"}
                icon={
                    <Sidebar.Icon
                        element={<img src="/images/wby-logo.png" alt="Webiny" />}
                        label={"Webiny"}
                    />
                }
                footer={
                    <DropdownMenu
                        trigger={
                            <Sidebar.Item
                                icon={<Sidebar.Item.Icon label="Settings" element={<InfoIcon />} />}
                                text={"Support"}
                                action={<Sidebar.Item.Action element={<MoreVertIcon />} />}
                            />
                        }
                        className={"w-[225px]"}
                    >
                        <DropdownMenu.Item
                            text={"API Playground"}
                            icon={<ApiPlaygroundIcon />}
                        />
                        <DropdownMenu.Item text={"Documentation"} icon={<DocsIcon />} />
                        <DropdownMenu.Item text={"GitHub"} icon={<GithubIcon />} />
                        <DropdownMenu.Item text={"Slack"} icon={<ChatIcon />} />
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                            text={
                                <div className={"flex items-center"}>
                                    Webiny 6.0.0
                                    <Tag
                                        variant={"accent"}
                                        content={"WCP "}
                                        className={"ml-sm-extra"}
                                    />
                                </div>
                            }
                        />
                    </DropdownMenu>
                }
            >
                <Sidebar.Link
                    pinnable
                    text={"Audit Logs"}
                    action={
                        <Sidebar.Item.Action
                            element={<MoreVertIcon />}
                            onClick={() => console.log("More action clicked")}
                        />
                    }
                    to={"#audit-logs"}
                    active={hash === "#audit-logs"}
                    icon={<Sidebar.Item.Icon label="Audit Logs" element={<AuditLogsIcon />} />}
                />
                <Sidebar.Link
                    pinnable
                    text={"Form Builder"}
                    to={"#form-builder"}
                    active={hash === "#form-builder"}
                    icon={<Sidebar.Item.Icon label="Form Builder" element={<FormBuilderIcon />} />}
                />
                <Sidebar.Item
                    pinnable
                    text={"File Manager"}
                    onClick={() => {
                        alert("File Manager clicked");
                    }}
                    icon={<Sidebar.Item.Icon label="File Manager" element={<FileManagerIcon />} />}
                />
                <Sidebar.Item
                    text={"Content"}
                    icon={<Sidebar.Item.Icon label="Headless CMS" element={<CmsIcon />} />}
                >
                    <Sidebar.Item
                        text={"Vehicles"}
                        icon={<Sidebar.Item.Icon label="Headless CMS" element={<GridIcon />} />}
                        action={<Sidebar.Item.Action element={<MoreVertIcon />} />}
                    >
                        <Sidebar.Link
                            pinnable
                            text={"Cars"}
                            to={"#cms-cars"}
                            active={hash === "#cms-cars"}
                        />
                        <Sidebar.Link
                            text={"Planes"}
                            to={"#cms-planes"}
                            active={hash === "#cms-planes"}
                        />
                    </Sidebar.Item>{" "}
                    <Sidebar.Item
                        text={"Ungrouped"}
                        icon={<Sidebar.Item.Icon label="Headless CMS" element={<GridIcon />} />}
                        action={<Sidebar.Item.Action element={<MoreVertIcon />} />}
                    >
                        <Sidebar.Link
                            text={"Articles"}
                            to={"#cms-articles"}
                            active={hash === "#cms-articles"}
                        />
                        <Sidebar.Link
                            text={"Settings"}
                            to={"#cms-settings"}
                            active={hash === "#cms-settings"}
                        />
                    </Sidebar.Item>
                </Sidebar.Item>
                <Sidebar.Item
                    text={"Headless CMS"}
                    icon={<Sidebar.Item.Icon label="Headless CMS" element={<CmsIcon />} />}
                >
                    <Sidebar.Group text={"Content Models"} />
                    <Sidebar.Link
                        pinnable
                        text={"Groups"}
                        to={"#cms-groups"}
                        active={hash === "#cms-groups"}
                    />
                    <Sidebar.Link
                        pinnable
                        text={"Models"}
                        to={"#cms-models"}
                        active={hash === "#cms-models"}
                    />
                </Sidebar.Item>
                <Sidebar.Item
                    text={"Page Builder"}
                    icon={<Sidebar.Item.Icon label="Page Builder" element={<PageBuilderIcon />} />}
                >
                    <Sidebar.Group text={"Blocks"} />
                    <Sidebar.Link
                        text={"Blocks"}
                        to={"#pb-blocks"}
                        active={hash === "#pb-blocks"}
                    />
                    <Sidebar.Link
                        text={"Categories"}
                        to={"#pb-blocks-categories"}
                        active={hash === "#pb-blocks-categories"}
                    />

                    <Sidebar.Group text={"Pages"} active={hash === `#pb-pages`} />
                    <Sidebar.Link
                        to={"#pb-pages-categories"}
                        text={"Categories"}
                        active={hash === `#pb-pages-categories`}
                    />
                    <Sidebar.Link
                        to={"#pb-pages-menus"}
                        text={"Menus"}
                        active={hash === `#pb-pages-menus`}
                    />
                    <Sidebar.Link
                        to={"#pb-pages-pages"}
                        text={"Pages"}
                        active={hash === `#pb-pages-pages`}
                    />
                    <Sidebar.Link
                        to={"#pb-pages-templates"}
                        text={"Templates"}
                        disabled={true}
                        active={hash === `#pb-pages-templates`}
                    />
                </Sidebar.Item>
            </Sidebar>
        </SidebarProvider>
    );
};
