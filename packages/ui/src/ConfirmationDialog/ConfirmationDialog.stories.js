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
import readme from "./../ConfirmationDialog/README.md";
import { ButtonPrimary } from "./../Button";

// $FlowFixMe
import { ConfirmationDialog, PropsType } from "./ConfirmationDialog";

const story = storiesOf("Components/ConfirmationDialog", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"Icon with and without ConfirmationDialog"}>
                <StorySandboxExample>
                    <ConfirmationDialog
                        title="Pay Invoice"
                        message="Are you sure you want pay this invoice?"
                    >
                        {({ showConfirmation }) => {
                            return (
                                <ButtonPrimary
                                    onClick={() => {
                                        showConfirmation(
                                            () => console.log("Confirm"),
                                            () => console.log("Cancel")
                                        );
                                    }}
                                >
                                    Pay Invoice
                                </ButtonPrimary>
                            );
                        }}
                    </ConfirmationDialog>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                     <ConfirmationDialog
                        title="Pay Invoice"
                        message="Are you sure you want pay this invoice?"
                    >
                        {({ showConfirmation }) => {
                            return (
                                <ButtonPrimary
                                    onClick={() => {
                                        showConfirmation(
                                            () => console.log("Confirm"),
                                            () => console.log("Cancel")
                                        );
                                    }}
                                >
                                    Pay Invoice
                                </ButtonPrimary>
                            );
                        }}
                    </ConfirmationDialog>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
