import React from "react";
import { CmsCreatedBy } from "~/types";
import { Box } from "./Box";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";

interface Props {
    createdBy: CmsCreatedBy;
    createdOn: Date;
}
export const CreatedBy: React.FC<Props> = ({ createdBy, createdOn }) => {
    return (
        <Box icon={null} name={"Created By"}>
            {createdBy.displayName}, <TimeAgo datetime={createdOn} />
        </Box>
    );
};
