import React from "react";

import { ReactComponent as TagIcon } from "@material-design-icons/svg/outlined/label.svg";
import { Typography } from "@webiny/ui/Typography";

import { TagContainer, Icon } from "./styled";
import { TagItem } from "~/types";

type TagProps = {
    tag: TagItem;
    active: boolean;
    onTagClick: (tag: TagItem) => void;
};

export const Tag = ({ tag, active, onTagClick }: TagProps) => {
    return (
        <TagContainer onClick={() => onTagClick(tag)}>
            <Icon active={active}>
                <TagIcon />
            </Icon>
            <Typography use={"body2"} tag={"div"}>
                {tag}
            </Typography>
        </TagContainer>
    );
};