import React from "react";
import { CmsIdentity } from "~/types";
import { Box } from "./Box";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
import TimeAgo from "timeago-react";

interface Props {
    createdBy: CmsIdentity;
    createdOn: Date;
}
export const CreatedBy: React.VFC<Props> = ({ createdBy, createdOn }) => {
    return (
        <Box icon={null} name={"Created By"}>
            {createdBy.displayName} <br />
            <TimeAgo datetime={createdOn} />
        </Box>
    );
};
