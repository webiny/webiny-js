import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./../Avatar/README.md";
import { Avatar } from "./Avatar";

const story = storiesOf("Components/Avatar", module);

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
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
    },
    { info: { propTables: [Avatar] } }
);
