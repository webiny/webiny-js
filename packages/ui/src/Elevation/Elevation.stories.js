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
import readme from "./../Elevation/README.md";
import { withKnobs, boolean, select } from "@storybook/addon-knobs";

// $FlowFixMe
import { Elevation, PropsType } from "./Elevation";

const story = storiesOf("Components/Elevation", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const transition = boolean("Transition", true);
    const z = select("Z (elevation height)", [...Array(25).keys()], 1);

    const style = {
        padding: 20,
        backgroundColor: "white"
    };

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"An area with applied elevation"}>
                <StorySandboxExample>
                    <Elevation z={z} transition={transition}>
                        <div style={style}>This is an elevated content.</div>
                    </Elevation>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <Elevation z={${z}} transition={${transition}}>
                            <div>This is an elevated content.</div>
                        </Elevation>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
