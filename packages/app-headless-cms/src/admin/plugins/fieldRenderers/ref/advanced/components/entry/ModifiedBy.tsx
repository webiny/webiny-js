import React from "react";
import { CmsIdentity } from "~/types";
import { Box } from "./Box";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";

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
