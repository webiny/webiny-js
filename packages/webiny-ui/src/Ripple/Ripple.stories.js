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
import readme from "./../Ripple/README.md";
import { Icon } from "./../Icon";
import { withKnobs, boolean } from "@storybook/addon-knobs";

import { ReactComponent as AutoRenewIcon } from "./svg/baseline-autorenew-24px.svg";
import { ReactComponent as CloudDoneIcon } from "./svg/baseline-cloud_done-24px.svg";
import { ReactComponent as BaselineDeleteIcon } from "./svg/baseline-delete-24px.svg";
import { ReactComponent as BaselineDoneIcon } from "./svg/baseline-done-24px.svg";

// $FlowFixMe
import { Ripple, PropsType } from "./Ripple";

const story = storiesOf("Components/Ripple", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const disabled = boolean("Disabled", false);

    const style = { padding: 20, width: 20, height: 20, display: "inline-block" };

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"Icon with and without ripple"}>
                <StorySandboxExample>
                    <div>
                        <div>No effect</div>
                        <div style={style}>
                            <Icon icon={<AutoRenewIcon />} />
                        </div>

                        <div>
                            <code>unbounded</code>
                        </div>
                        <Ripple type="unbounded" disabled={disabled}>
                            <div style={style}>
                                <Icon icon={<CloudDoneIcon />} />
                            </div>
                        </Ripple>

                        <div>
                            <code>primary</code>
                        </div>
                        <Ripple type="primary" disabled={disabled}>
                            <div style={style}>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </div>
                        </Ripple>

                        <div>
                            <code>accent</code>
                        </div>
                        <Ripple type="accent" disabled={disabled}>
                            <div style={style}>
                                <Icon icon={<BaselineDoneIcon />} />
                            </div>
                        </Ripple>
                    </div>
                </StorySandboxExample>
                <StorySandboxCode>
                    <div>
                        <div>
                            <Icon icon={<AutoRenewIcon />} />
                        </div>

                        <Ripple type="unbounded" disabled={disabled}>
                            <div>
                                <Icon icon={<CloudDoneIcon />} />
                            </div>
                        </Ripple>

                        <Ripple type="primary" disabled={disabled}>
                            <div>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </div>
                        </Ripple>

                        <Ripple type="accent" disabled={disabled}>
                            <div>
                                <Icon icon={<BaselineDoneIcon />} />
                            </div>
                        </Ripple>
                    </div>
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
