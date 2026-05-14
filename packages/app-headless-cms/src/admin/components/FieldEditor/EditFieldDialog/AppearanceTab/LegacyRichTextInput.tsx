import React from "react";
import { Alert } from "@webiny/admin-ui";

export const LegacyRichTextInput = () => {
    return (
        <Alert type={"info"} variant={"subtle"}>
            <div>
                <strong>You have legacy editor enabled</strong>
            </div>
            <div>
                Your project has been upgraded from an older Webiny version, with EditorJS as the
                default rich text editor. We recommend switching to the new Lexical rich text
                editor, where possible.
                <br />
                <br />
                Read more about this in our{" "}
                <a
                    href={"https://webiny.link/hcms-legacy-rte-support"}
                    rel="noreferrer"
                    target={"_blank"}
                >
                    upgrade guide
                </a>
                .
            </div>
        </Alert>
    );
};
