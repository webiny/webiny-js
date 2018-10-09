// @flow
import * as React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "webiny-storybook-utils/Story";

import readme from "./../Image/README.md";
import { withKnobs } from "@storybook/addon-knobs";

// $FlowFixMe
import { Image } from "./Image";

const story = storiesOf("Components/Image", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StorySandbox>
                <StorySandboxExample>
                    <Image src="http://i.pravatar.cc/150?img=49" alt="Nice image." />
                </StorySandboxExample>
                <StorySandboxCode>
                    <Image src="http://i.pravatar.cc/150?img=49" alt="Nice image." />
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
