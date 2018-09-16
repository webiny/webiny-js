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
import readme from "./../Dialog/README.md";
import { withKnobs, boolean } from "@storybook/addon-knobs";

import {
    Dialog,
    DialogAccept,
    DialogCancel,
    DialogFooter,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody,
    // $FlowFixMe
    PropsType
} from ".";

const story = storiesOf("Components/Dialog", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const open = boolean("Open", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"dialog"}>
                <StorySandboxExample title={"A list with all possible options"}>
                    Toggle <code>open</code> prop via the bottom knobs.
                    <br />
                    <br />
                    Note that instead of using <code>DialogFooter.Button</code> with{" "}
                    <code>accept</code> or <code>cancel</code> prop, you can use a shorter{" "}
                    <code>DialogAccept</code> and <code>DialogCancel</code> components respectively.
                    <Dialog open={open}>
                        <DialogHeader>
                            <DialogHeaderTitle>Delete confirmation</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>Are you sure you want to delete?</DialogBody>
                        <DialogFooter>
                            <DialogCancel onClick={() => console.log("Cancel")}>
                                Cancel
                            </DialogCancel>
                            <DialogAccept onClick={() => console.log("Accept")}>OK</DialogAccept>
                        </DialogFooter>
                    </Dialog>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Dialog open={${open}}>
                        <DialogHeader>
                            <DialogHeaderTitle>Delete confirmation</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>Are you sure you want to delete?</DialogBody>
                        <DialogFooter>
                            <DialogCancel onClick={() => console.log("Cancel")}>Cancel</DialogCancel>
                            <DialogAccept onClick={() => console.log("Accept")}>OK</DialogAccept>
                        </DialogFooter>
                    </Dialog>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
