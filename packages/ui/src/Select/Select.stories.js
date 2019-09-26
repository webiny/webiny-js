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
} from "@webiny/storybook-utils/Story";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./README.md";

import { Form } from "@webiny/form";

// $FlowFixMe
import { Select, PropsType } from "./Select";

const story = storiesOf("Components/Select", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const disabled = boolean("Disabled", false);
    const box = boolean("Box", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample title={"Simple select with a label and description"}>
                    <Form>
                        {({ Bind }) => (
                            <Bind name="pet">
                                <Select
                                    label="Pets"
                                    disabled={disabled}
                                    box={box.toString()}
                                    description="Choose a pet of your liking."
                                >
                                    <optgroup label="Dogs">
                                        <option value="germanShepherd">German Shepherd</option>
                                        <option value="bulldog">Bulldog</option>
                                        <option value="sharPei">Shar-Pei</option>
                                    </optgroup>
                                    <optgroup label="Other">
                                        <option value="parrot">Parrot</option>
                                        <option value="cat">Cat</option>
                                        <option value="guinea ">Guinea Pig</option>
                                    </optgroup>
                                </Select>
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <Bind name="pet">
                               <Select
                                    label="Pets"
                                    disabled={disabled}
                                    box={box.toString()}
                                    description="Choose a pet of your liking."
                                >
                                   <optgroup label="Dogs">
                                        <option value="germanShepherd">
                                            German Shepherd
                                        </option>
                                        <option value="bulldog">Bulldog</option>
                                        <option value="sharPei">Shar-Pei</option>
                                    </optgroup>
                                    <optgroup label="Other">
                                        <option value="parrot">Parrot</option>
                                        <option value="cat">Cat</option>
                                        <option value="guinea ">Guinea Pig</option>
                                    </optgroup>
                                </Select>
                            </Bind>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
