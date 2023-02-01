import React from "react";
import { CmsCreatedBy } from "~/types";
import { Box } from "./Box";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";
interface Props {
    modifiedBy?: CmsCreatedBy | null;
    savedOn: Date;
}
export const ModifiedBy: React.FC<Props> = ({ modifiedBy, savedOn }) => {
    return (
        <Box icon={null} name={"Modified By"}>
            {modifiedBy?.displayName && (
                <>
                    {modifiedBy?.displayName}, <TimeAgo datetime={savedOn} />
                </>
            )}
        </Box>
    );
};
