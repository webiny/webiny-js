import React, { useCallback } from "react";
import { storiesOf } from "@storybook/react";

import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import readme from "./README.md";

import { RichTextEditor, RichTextEditorValue } from "./index";

const story = storiesOf("Components/RichTextEditor", module);

story.add(
    "usage",
    () => {
        const onChange = useCallback((data: RichTextEditorValue) => {
            console.log(data);
        }, []);

        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample>
                        <RichTextEditor value={undefined} onChange={onChange} />
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                        import { RichTextEditor } from "..";

                        <RichTextEditor/>
                    `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [RichTextEditor] } }
);
