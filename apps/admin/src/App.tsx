import React from "react";
import { Accordion, Button, Flex, theme, ThemeProvider } from "@webiny/ui-ant-design";
import "./App.scss";

import { ReactComponent as DashboardIcon } from "@material-design-icons/svg/outlined/space_dashboard.svg";

const items = [
    {
        title: "Page Builder",
        description: "Manage Page Builder app access permissions",
        icon: <DashboardIcon />,
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas hendrerit nunc sem, sollicitudin suscipit sapien luctus eu. Donec dignissim sapien ac dui feugiat hendrerit. In hac habitasse plate dictumst. Fusce molestie condimentum justo, in fringilla ipsum lobortis non. Etiam lectus nunc, consectetur id lorem in, pretiumornare ante."
    },
    {
        title: "Headless CMS",
        description: "Manage Headless CMS app access permissions",
        icon: <DashboardIcon />,
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas hendrerit nunc sem, sollicitudin suscipit sapien luctus eu. Donec dignissim sapien ac dui feugiat hendrerit. In hac habitasse plate dictumst. Fusce molestie condimentum justo, in fringilla ipsum lobortis non. Etiam lectus nunc, consectetur id lorem in, pretiumornare ante."
    },
    {
        title: "File Manager",
        description: "Manage File Manager app access permissions",
        icon: <DashboardIcon />,
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas hendrerit nunc sem, sollicitudin suscipit sapien luctus eu. Donec dignissim sapien ac dui feugiat hendrerit. In hac habitasse plate dictumst. Fusce molestie condimentum justo, in fringilla ipsum lobortis non. Etiam lectus nunc, consectetur id lorem in, pretiumornare ante."
    }
];

export const App = () => {
    return (
        <ThemeProvider theme={theme}>
            <div style={{ margin: "60px 30px" }}>
                <h1>Accordion</h1>
                <div style={{ width: "800px", maxWidth: "100%" }}>
                    <Accordion items={items} />
                </div>
            </div>
            <div style={{ margin: "60px 30px" }}>
                <h1>Button sm</h1>
                <Flex gap="middle" align={"center"} wrap>
                    <Button type="primary" size={"small"}>
                        {"Button"}
                    </Button>
                    <span>Missing type secondary</span>
                    <Button size={"small"}>{"Button"}</Button>
                    <Button type="text" size={"small"}>
                        {"Button"}
                    </Button>
                </Flex>
                <h1>Button md</h1>
                <Flex gap="middle" align={"center"} wrap>
                    <Button type="primary" size={"middle"}>
                        {"Button"}
                    </Button>
                    <span>{"Missing type secondary"}</span>
                    <Button size={"middle"}>{"Button"}</Button>
                    <Button type="text" size={"middle"}>
                        {"Button"}
                    </Button>
                </Flex>
                <h1>Button lg</h1>
                <Flex gap="middle" align={"center"} wrap>
                    <Button type="primary" size={"large"}>
                        {"Button"}
                    </Button>
                    <span>{"Missing type secondary"}</span>
                    <Button size={"large"}>{"Button"}</Button>
                    <Button type="text" size={"large"}>
                        {"Button"}
                    </Button>
                </Flex>
                <h1>Button xl</h1>
                <p>{"Missing size XL"}</p>
            </div>
        </ThemeProvider>
    );
};
