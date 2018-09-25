// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StoryProps, StorySandbox } from "webiny-storybook-utils/Story";
import readme from "./../Avatar/README.md";

// $FlowFixMe
import { Avatar, PropsType } from "./Avatar";

const story = storiesOf("Components/Avatar", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"A simple avatar"}>
                <div>
                    <Avatar
                        width={48}
                        height={48}
                        alt="Test alt."
                        fallbackText="T"
                        src="http://i.pravatar.cc/150?img=49"
                    />

                    <br />
                    <br />

                    <Avatar width={64} height={64} alt="Test alt." fallbackText="T" src={""} />
                </div>
            </StorySandbox>
        </Story>
    );
});
