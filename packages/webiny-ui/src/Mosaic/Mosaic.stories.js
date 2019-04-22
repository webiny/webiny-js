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
import readme from "./../Mosaic/README.md";

// $FlowFixMe
import { Mosaic, PropsType } from "./Mosaic";

const story = storiesOf("Components/Mosaic", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"A simple responsive mosaic."}>
                <StorySandboxExample>
                    <Mosaic>
                        <img
                            alt="Image 1"
                            src={"https://via.placeholder.com/800x600/001F3F/FFFFFF.png?text=1"}
                        />
                        <img
                            alt="Image 2"
                            src={"https://via.placeholder.com/400x300/0074D9/FFFFFF.png?text=2"}
                        />
                        <img
                            alt="Image 3"
                            src={"https://via.placeholder.com/1024x768/7FDBFF/FFFFFF.png?text=3"}
                        />
                        <img
                            alt="Image 4"
                            src={"https://via.placeholder.com/1280x1024/39CCCC/FFFFFF.png?text=4"}
                        />
                        <img
                            alt="Image 5"
                            src={"https://via.placeholder.com/640x480/3D9970/FFFFFF.png?text=5"}
                        />
                        <img
                            alt="Image 6"
                            src={"https://via.placeholder.com/1000x500/2ECC40/FFFFFF.png?text=6"}
                        />
                        <img
                            alt="Image 7"
                            src={"https://via.placeholder.com/700x1000/01FF70/FFFFFF.png?text=7"}
                        />
                        <img
                            alt="Image 8"
                            src={"https://via.placeholder.com/800x600/FFDC00/FFFFFF.png?text=8"}
                        />
                        <img
                            alt="Image 9"
                            src={"https://via.placeholder.com/200x100/FF851B/FFFFFF.png?text=9"}
                        />
                        <img
                            alt="Image 10"
                            src={"https://via.placeholder.com/200x100/FF4136/FFFFFF.png?text=10"}
                        />
                    </Mosaic>
                </StorySandboxExample>
                <StorySandboxCode>
                    <Mosaic>
                        <img alt="Image 1" src={"https://..."} />
                        <img alt="Image 2" src={"https://..."} />
                        <img alt="Image 3" src={"https://..."} />
                        <img alt="Image 4" src={"https://..."} />
                        <img alt="Image 5" src={"https://..."} />
                        <img alt="Image 6" src={"https://..."} />
                        <img alt="Image 7" src={"https://..."} />
                        <img alt="Image 8" src={"https://..."} />
                        <img alt="Image 9" src={"https://..."} />
                        <img alt="Image 10" src={"https://..."} />
                    </Mosaic>
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
