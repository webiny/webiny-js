import * as React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import readme from "./../Snackbar/README.md";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import { ButtonPrimary } from "./../Button";
import { Snackbar } from "./Snackbar";

const story = storiesOf("Components/Snackbar", module);
story.addDecorator(withKnobs);

class SnackbarContainer extends React.Component<{ leading: boolean }, { show: boolean }> {
    state = {
        show: false
    };

    render() {
        return (
            <React.Fragment>
                <Snackbar
                    open={this.state.show}
                    onClose={() => this.setState({ show: false })}
                    message="This is a message."
                    leading={this.props.leading}
                    action="Something"
                />
                <ButtonPrimary onClick={() => this.setState({ show: true })}>
                    Show message
                </ButtonPrimary>
            </React.Fragment>
        );
    }
}

story.add(
    "usage",
    () => {
        const leading = boolean("leading", false);

        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample>
                        <SnackbarContainer leading />
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                        <div>
                             <Snackbar
                                open={this.state.show}
                                leading={${leading}}
                                onHide={() => this.setState({ show: false })}
                                message="This is a message."
                            />
                            <ButtonPrimary onClick={() => this.setState({ show: true })}>
                                Show message
                            </ButtonPrimary>
                        </div>
                    `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Snackbar] } }
);
