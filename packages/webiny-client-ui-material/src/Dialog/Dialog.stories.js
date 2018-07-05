// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import Story from "webiny-storybook-utils/Story";
import readme from "./../Dialog/README.md";
import { withKnobs, boolean } from "@storybook/addon-knobs";

// $FlowFixMe
import Dialog, { PropsType } from "./Dialog";

const story = storiesOf("Components/Dialog", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const open = boolean("Open", false);

    return (
        <Story>
            <Story.Readme>{readme}</Story.Readme>
            <Story.Props>{PropsType}</Story.Props>
            <Story.Sandbox title={"dialog"}>
                <Story.Sandbox.Example title={"A list with all possible options"}>
                    Toggle <code>open</code> prop via the bottom knobs.
                    <Dialog open={open}>
                        <Dialog.Header>
                            <Dialog.Header.Title>Delete confirmation</Dialog.Header.Title>
                        </Dialog.Header>
                        <Dialog.Body>Are you sure you want to delete?</Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.Footer.Button onClick={() => console.log("Cancel")} cancel>
                                Cancel
                            </Dialog.Footer.Button>
                            <Dialog.Footer.Button onClick={() => console.log("Accept")} accept>
                                OK
                            </Dialog.Footer.Button>
                        </Dialog.Footer>
                    </Dialog>
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
                    {`
                    <Dialog open={open}>
                        <Dialog.Header>
                            <Dialog.Header.Title>Delete confirmation</Dialog.Header.Title>
                        </Dialog.Header>
                        <Dialog.Body>Are you sure you want to delete?</Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.Footer.Button onClick={() => console.log("Cancel")} cancel>Cancel</Dialog.Footer.Button>
                            <Dialog.Footer.Button onClick={() => console.log("Accept")} accept>OK</Dialog.Footer.Button>
                        </Dialog.Footer>
                    </Dialog>
                    `}
                </Story.Sandbox.Code>
            </Story.Sandbox>
        </Story>
    );
});
