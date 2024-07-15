import React from "react";
import { Button, Flex, theme, ThemeProvider } from "@webiny/ui-ant-design";
import "./App.scss";

export const App = () => {
    return (
        <ThemeProvider theme={theme}>
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
