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
import { SingleImageUpload, PropsType } from "./SingleImageUpload";

const story = storiesOf("Components/ImageUpload", module);
story.addDecorator(withKnobs);

const image = {
    id: 1,
    name: "1st_image.jpg",
    src: "http://i.pravatar.cc/150?img=49",
    type: "image/jpeg",
    size: 901611
};

story.add("Single Image Upload", () => {
    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample>
                    <div style={{ maxWidth: 200 }}>
                        <Form data={{ image }}>
                            {({ Bind }) => (
                                <Bind name="image">
                                    <SingleImageUpload
                                        cropper={{
                                            aspectRatio: 1
                                        }}
                                        label="Your previously uploaded image:"
                                        disabled={disabled}
                                        description="Image will be publicly visible."
                                    />
                                </Bind>
                            )}
                        </Form>
                    </div>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <Form data={${JSON.stringify({ image: image })}}>
                            {({ Bind }) => (
                                <Bind name="image">
                                     <SingleImageUpload
                                        cropper={{
                                            aspectRatio: 4 / 3
                                        }}
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
