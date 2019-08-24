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
} from "@webiny/storybook-utils/Story";
import readme from "./../TopProgressBar/README.md";
import { ButtonPrimary } from "./../Button";
// $FlowFixMe
import { TopProgressBar, PropsType } from "./TopProgressBar";

const story = storiesOf("Components/TopProgressBar", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>

            <StorySandbox>
                <StorySandboxExample>
                    <TopProgressBar>
                        {({ start, finish }) => (
                            <React.Fragment>
                                <ButtonPrimary onClick={start}>Start</ButtonPrimary>
                                &nbsp;
                                <ButtonPrimary onClick={finish}>Done</ButtonPrimary>
                            </React.Fragment>
                        )}
                    </TopProgressBar>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <TopProgressBar>
                        {({start, done}) => (
                            <React.Fragment>
                                <ButtonPrimary onClick={start}>Start</ButtonPrimary>
                                <ButtonPrimary onClick={done}>Done</ButtonPrimary>
                            </React.Fragment>
                        )}
                    </TopProgressBar>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
