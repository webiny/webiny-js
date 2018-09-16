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
import readme from "./../Snackbar/README.md";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import { ButtonPrimary } from "./../Button";

// $FlowFixMe
import { Snackbar, PropsType } from "./Snackbar";

const story = storiesOf("Components/Snackbar", module);
story.addDecorator(withKnobs);

class SnackbarContainer extends React.Component<{ alignStart: boolean }, { show: boolean }> {
    constructor() {
        super();
        this.state = {
            show: false
        };
    }

    render() {
        return (
            <React.Fragment>
                <Snackbar
                    show={this.state.show}
                    onHide={() => this.setState({ show: false })}
                    message="This is a message."
                    alignStart={this.props.alignStart}
                    actionText="Something"
                    actionHandler={() => console.log("Action triggered.")}
                />
                <ButtonPrimary onClick={() => this.setState({ show: true })}>
                    Show message
                </ButtonPrimary>
            </React.Fragment>
        );
    }
}

story.add("usage", () => {
    const alignStart = boolean("alignStart", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample>
                    <SnackbarContainer alignStart={alignStart} />
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <div>
                             <Snackbar
                                show={this.state.show}
                                alignStart={${alignStart}}
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
});
