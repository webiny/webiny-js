import React from "react";
import { IconButton, Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as NewTabIcon } from "@webiny/icons/open_in_new.svg";
import { usePreviewLink } from "./usePreviewLink.js";

export const OpenInNewTab = () => {
    const link = usePreviewLink();

    return (
        <Tooltip
            content={<Text size="md">Preview page in a new tab</Text>}
            side="bottom"
            trigger={
                <IconButton
                    icon={<NewTabIcon />}
                    size="md"
                    onClick={() => {
                        window.open(link, "_blank");
                    }}
                    variant={"ghost"}
                />
            }
        />
    );
};
