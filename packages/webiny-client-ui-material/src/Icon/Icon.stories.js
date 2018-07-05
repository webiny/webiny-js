// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import Story from "webiny-storybook-utils/Story";
import readme from "./../Icon/README.md";

// $FlowFixMe
import Icon, { PropsType } from "./Icon";

const story = storiesOf("Components/Icon", module);

story.add("simple icon", () => {
    return (
        <Story>
            <Story.Readme>{readme}</Story.Readme>
            <Story.Props>{PropsType}</Story.Props>
            <Story.Sandbox title={"A simple icon"}>
                <div>
                    <Icon name="save" />&nbsp;
                    <Icon name="edit" />&nbsp;
                    <Icon name="rocket" />&nbsp;
                    <Icon name="envelope" />&nbsp;
                    <Icon name="building" />
                </div>
            </Story.Sandbox>
        </Story>
    );
});
