// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StoryProps,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "webiny-storybook-utils/Story";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./README.md";

import { Form } from "webiny-form";

// $FlowFixMe
import { Image, PropsType } from ".";

const story = storiesOf("Components/Image", module);
story.addDecorator(withKnobs);

const image = {
    id: 1,
    name: "1st_image.jpg",
    src: "http://i.pravatar.cc/150?img=49",
    type: "image/jpeg",
    size: 901611
};

story.add("usage", () => {
    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample>
                    <Form data={{ image }}>
                        {({ Bind }) => (
                            <Bind name="image">
                                <Image
                                    label="Your previously uploaded image:"
                                    disabled={disabled}
                                    description="This list will not be shown to other users."
                                />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <Form data={${JSON.stringify({ image: image })}}>
                            {({ Bind }) => (
                                <Bind name="image">
                                     <Image
                                        label="Your previously uploaded image:"
                                        disabled={disabled}
                                        description="This list will not be shown to other users."
                                    />
                                </Bind>
                            )}
                        </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
