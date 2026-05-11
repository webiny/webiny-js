import React from "react";
import type { CmsIdentity } from "~/types.js";
import { Box } from "./Box.js";
import { TimeAgo } from "@webiny/admin-ui";

interface ModifiedByProps {
    modifiedBy?: CmsIdentity | null;
    savedOn: Date;
}

export const ModifiedBy = ({ modifiedBy, savedOn }: ModifiedByProps) => {
    const showInformation = !!(modifiedBy?.displayName && savedOn);

    if (!showInformation) {
        return null;
    }

    return (
        <Box icon={null} name={"Modified By"}>
            {showInformation && (
                <>
                    {modifiedBy?.displayName} <TimeAgo datetime={savedOn} />
                </>
            )}
        </Box>
    );
};
