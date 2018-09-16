// @flow
import * as React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StoryProps,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "webiny-storybook-utils/Story";

import readme from "./README.md";

// $FlowFixMe
import { Typography, PropsType } from "./Typography";

const story = storiesOf("Components/Typography", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"Typography styles"}>
                <StorySandboxExample>
                    <ul>
                        <li>
                            <Typography use="headline1">headline1</Typography>
                        </li>
                        <li>
                            <Typography use="headline2">headline2</Typography>
                        </li>
                        <li>
                            <Typography use="headline3">headline3</Typography>
                        </li>
                        <li>
                            <Typography use="headline4">headline4</Typography>
                        </li>
                        <li>
                            <Typography use="headline5">headline5</Typography>
                        </li>
                        <li>
                            <Typography use="headline6">headline6</Typography>
                        </li>
                        <li>
                            <Typography use="subtitle1">subtitle1</Typography>
                        </li>
                        <li>
                            <Typography use="subtitle2">subtitle2</Typography>
                        </li>
                        <li>
                            <Typography use="body1">body1</Typography>
                        </li>
                        <li>
                            <Typography use="body2">body2</Typography>
                        </li>
                        <li>
                            <Typography use="caption">caption</Typography>
                        </li>
                        <li>
                            <Typography use="button">button</Typography>
                        </li>
                        <li>
                            <Typography use="overline">overline</Typography>
                        </li>
                    </ul>
                </StorySandboxExample>
                <StorySandboxCode>
                    <div>
                        <Typography use="headline1">headline1</Typography>
                        <Typography use="headline2">headline2</Typography>
                        <Typography use="headline3">headline3</Typography>
                        <Typography use="headline4">headline4</Typography>
                        <Typography use="headline5">headline5</Typography>
                        <Typography use="headline6">headline6</Typography>
                        <Typography use="subtitle1">subtitle1</Typography>
                        <Typography use="subtitle2">subtitle2</Typography>
                        <Typography use="body1">body1</Typography>
                        <Typography use="body2">body2</Typography>
                        <Typography use="caption">caption</Typography>
                        <Typography use="button">button</Typography>
                        <Typography use="overline">overline</Typography>
                    </div>
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
