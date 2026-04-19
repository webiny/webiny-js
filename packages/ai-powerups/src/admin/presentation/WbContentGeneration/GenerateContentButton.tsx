import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as ChatIcon } from "@webiny/icons/chat.svg";

export const GenerateContentButton = () => {
    return <IconButton variant="ghost" icon={<ChatIcon />} onClick={() => void 0} />;
};
