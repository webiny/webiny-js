import React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import readme from "./README.md";
import { withKnobs } from "@storybook/addon-knobs";

import { CollapsibleList } from "./index";
import { SimpleListItem } from "./../List";

const story = storiesOf("Components/List", module);
story.addDecorator(withKnobs);

story.add(
    "collapsible list",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>

                <StorySandbox>
                    <StorySandboxExample>
                        <CollapsibleList handle={<SimpleListItem text="Fruits" />}>
                            <SimpleListItem text="Bananas" />
                            <SimpleListItem text="Grapes" />
                            <SimpleListItem text="Oranges" />
                        </CollapsibleList>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                         <CollapsibleList handle={<SimpleListItem text="Fruits" />}>
                            <SimpleListItem text="Bananas" />
                            <SimpleListItem text="Grapes" />
                            <SimpleListItem text="Oranges" />
                        </CollapsibleList>
                      `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    {
        info: {
            propTables: [CollapsibleList, SimpleListItem]
        }
    }
);
