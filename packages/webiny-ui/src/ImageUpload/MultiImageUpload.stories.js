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
import { MultiImageUpload, PropsType } from "./MultiImageUpload";

const story = storiesOf("Components/ImageUpload", module);
story.addDecorator(withKnobs);

const images = [
    {
        id: 1,
        name: "1st_image.jpg",
        src: "http://i.pravatar.cc/150?img=49",
        type: "image/jpeg",
        size: 901611
    },
    {
        id: 2,
        name: "2nd_image.jpg",
        src: "http://i.pravatar.cc/150?img=63",
        type: "image/jpeg",
        size: 902612
    },
    {
        id: 3,
        name: "3rd_image.jpg",
        src: "http://i.pravatar.cc/150?img=24",
        type: "image/jpeg",
        size: 903613
    },
    {
        id: 4,
        name: "4th_image.jpg",
        src: "http://i.pravatar.cc/150?img=57",
        type: "image/jpeg",
        size: 904614
    },
    {
        id: 5,
        name: "5th_image.jpg",
        src: "http://i.pravatar.cc/150?img=31",
        type: "image/jpeg",
        size: 905615
    }
];

story.add("Multi Image Upload", () => {
    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample>
                    <Form data={{ images }}>
                        {({ Bind }) => (
                            <Bind name="images">
                                <MultiImageUpload
                                    label="Your previously uploaded images:"
                                    disabled={disabled}
                                    description="This list will not be shown to other users."
                                    cropper={{
                                        aspectRatio: 1
                                    }}
                                />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <Form data={${JSON.stringify({ images: images })}}>
                            {({ Bind }) => (
                                <Bind name="images">
                                     <MultiImageUpload
                                        label="Your previously uploaded images:"
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
