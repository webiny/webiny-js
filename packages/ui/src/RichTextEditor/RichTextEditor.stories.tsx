import React, { useCallback } from "react";
import { storiesOf } from "@storybook/react";
import { FileManager } from "@webiny/app-admin/components/FileManager";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import readme from "./README.md";

import { RichTextEditor } from "./index";

const story = storiesOf("Components/RichTextEditor", module);

story.add(
    "usage",
    () => {
        const onChange = useCallback(data => {
            console.log(data);
        }, []);

        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample>
                        <RichTextEditor value={null} onChange={onChange} />
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                        import { RichTextEditor } from "@webiny/ui/RichTextEditor";

                        <RichTextEditor/>
                    `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [RichTextEditor] } }
);
