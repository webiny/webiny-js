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
import readme from "./../Mosaic/README.md";
import { Icon } from "./../Icon";
import { withKnobs, boolean } from "@storybook/addon-knobs";

import { ReactComponent as AutoRenewIcon } from "./svg/baseline-autorenew-24px.svg";
import { ReactComponent as CloudDoneIcon } from "./svg/baseline-cloud_done-24px.svg";
import { ReactComponent as BaselineDeleteIcon } from "./svg/baseline-delete-24px.svg";
import { ReactComponent as BaselineDoneIcon } from "./svg/baseline-done-24px.svg";

// $FlowFixMe
import { Mosaic, PropsType } from "./Mosaic";

const story = storiesOf("Components/Mosaic", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const disabled = boolean("Disabled", false);

    const style = { padding: 20, width: 20, height: 20, display: "inline-block" };

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"Icon with and without mosaic"}>
                <StorySandboxExample>
                    <div>
                        <div>No effect</div>
                        <div style={style}>
                            <Icon icon={<AutoRenewIcon />} />
                        </div>

                        <div>
                            <code>unbounded</code>
                        </div>
                        <Mosaic type="unbounded" disabled={disabled}>
                            <div style={style}>
                                <Icon icon={<CloudDoneIcon />} />
                            </div>
                        </Mosaic>

                        <div>
                            <code>primary</code>
                        </div>
                        <Mosaic type="primary" disabled={disabled}>
                            <div style={style}>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </div>
                        </Mosaic>

                        <div>
                            <code>accent</code>
                        </div>
                        <Mosaic type="accent" disabled={disabled}>
                            <div style={style}>
                                <Icon icon={<BaselineDoneIcon />} />
                            </div>
                        </Mosaic>
                    </div>
                </StorySandboxExample>
                <StorySandboxCode>
                    <div>
                        <div>
                            <Icon icon={<AutoRenewIcon />} />
                        </div>

                        <Mosaic type="unbounded" disabled={disabled}>
                            <div>
                                <Icon icon={<CloudDoneIcon />} />
                            </div>
                        </Mosaic>

                        <Mosaic type="primary" disabled={disabled}>
                            <div>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </div>
                        </Mosaic>

                        <Mosaic type="accent" disabled={disabled}>
                            <div>
                                <Icon icon={<BaselineDoneIcon />} />
                            </div>
                        </Mosaic>
                    </div>
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
