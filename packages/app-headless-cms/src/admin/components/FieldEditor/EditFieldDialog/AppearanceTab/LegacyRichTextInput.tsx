import React from "react";
import { Alert } from "@webiny/ui/Alert";

export const LegacyRichTextInput = () => {
    return (
        <Alert title={"You have legacy editor enabled"} type={"info"}>
            Your project has been upgraded from an older Webiny version, with EditorJS as the
            default rich text editor. We recommend switching to the new Lexical rich text editor,
            where possible.
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
        </Alert>
    );
};
