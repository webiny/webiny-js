import React from "react";
import { CmsIdentity } from "~/types";
import { Box } from "./Box";
import { TimeAgo } from "@webiny/ui/TimeAgo";

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
