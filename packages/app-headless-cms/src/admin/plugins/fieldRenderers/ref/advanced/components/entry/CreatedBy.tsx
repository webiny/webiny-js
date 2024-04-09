import React from "react";
import { CmsIdentity } from "~/types";
import { Box } from "./Box";
import { TimeAgo } from "@webiny/ui/TimeAgo";

interface CreatedByProps {
    createdBy: CmsIdentity;
    createdOn: Date;
}
export const CreatedBy = ({ createdBy, createdOn }: CreatedByProps) => {
    return (
        <Box icon={null} name={"Created By"}>
            {createdBy.displayName} <br />
            <TimeAgo datetime={createdOn} />
        </Box>
    );
};
