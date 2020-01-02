import React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import { withKnobs } from "@storybook/addon-knobs";
import readme from "./README.md";
import Carousel from "./Carousel";

const story = storiesOf("Components/Carousel", module);
story.addDecorator(withKnobs);

story.add(
    "usage - single",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample title={"Simple checkbox with a label and description"}>
                        <Carousel>
                            <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide1" />
                            <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide2" />
                            <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide3" />
                            <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide4" />
                            <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide5" />
                            <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide6" />
                        </Carousel>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                    <Carousel>
                        <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide1" />
                        <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide2" />
                        <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide3" />
                        <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide4" />
                        <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide5" />
                        <img src="http://placehold.it/1000x400/ffffff/c0392b/&text=slide6" />
                    </Carousel>
                    `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Carousel] } }
);
