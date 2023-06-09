import React from "react";
import dayjs from "dayjs";
import { ReactComponent as CalendarIcon } from "@material-design-icons/svg/outlined/today.svg";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { useFile } from "~/components/FileDetails";
import styled from "@emotion/styled";

const InlineIcon = styled(Icon)`
    &.mdc-button__icon {
        display: inline;
    }
`;

export const CreatedOn = () => {
    const { file } = useFile();

    return (
        <div>
            <InlineIcon icon={<CalendarIcon />} />
            <Typography use={"subtitle1"} tag={"span"}>
                {dayjs(file.createdOn).format("DD MMM YYYY [at] HH:mm")}
            </Typography>
        </div>
    );
};
