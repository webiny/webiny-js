import React from "react";
import { CmsIdentity } from "~/types";
import { Box } from "./Box";
import { TimeAgo } from "@webiny/ui/TimeAgo";

interface Props {
    modifiedBy?: CmsIdentity | null;
    savedOn: Date;
}

export const ModifiedBy: React.VFC<Props> = ({ modifiedBy, savedOn }) => {
    const showInformation = !!(modifiedBy?.displayName && savedOn);

    if (!showInformation) {
        return null;
    }

    return (
        <Box icon={null} name={"Modified By"}>
            {showInformation && (
                <>
                    {modifiedBy?.displayName} <br />
                    <TimeAgo datetime={savedOn} />
                </>
            )}
        </Box>
    );
};
