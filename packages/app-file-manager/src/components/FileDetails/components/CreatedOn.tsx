import React from "react";
import dayjs from "dayjs";
import { ReactComponent as CalendarIcon } from "@material-design-icons/svg/outlined/today.svg";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
import { useFile } from "~/hooks/useFile";

const CreatedOnWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const InlineIcon = styled(Icon)`
    margin-right: 5px;
    &.mdc-button__icon {
        display: inline;
        fill: var(--mdc-theme-text-secondary-on-background);
    }
`;

export const CreatedOn = () => {
    const { file } = useFile();

    return (
        <CreatedOnWrapper>
            <InlineIcon icon={<CalendarIcon />} />
            <Typography use={"caption"} tag={"span"}>
                {dayjs(file.createdOn).format("DD MMM YYYY [at] HH:mm")}
            </Typography>
        </CreatedOnWrapper>
    );
};
