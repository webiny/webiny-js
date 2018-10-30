// @flow
import * as React from "react";
import styled from "react-emotion";
import { Typography } from "webiny-ui/Typography";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as DeleteIcon } from "webiny-app-cms/editor/assets/icons/close.svg";

type Props = { title: string, onDelete: Function };

const Icon = styled("div")({
    position: "absolute",
    top: 0,
    right: 15
});

export default ({ title, onDelete }: Props) => {
    return (
        <Typography use="overline">
            {title}
            <Icon>
                <IconButton icon={<DeleteIcon />} onClick={onDelete} />
            </Icon>
        </Typography>
    );
};
