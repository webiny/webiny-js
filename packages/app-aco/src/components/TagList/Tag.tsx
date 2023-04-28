import React from "react";

import { ReactComponent as TagIcon } from "@material-design-icons/svg/outlined/label.svg";
import { Typography } from "@webiny/ui/Typography";

import { TagContainer, Icon } from "./styled";
import { TagItem } from "~/types";

type TagProps = {
    tagItem: TagItem;
    active: boolean;
    onTagClick: (tagItem: TagItem) => void;
};

export const Tag: React.VFC<TagProps> = ({ tagItem, active, onTagClick }) => {
    return (
        <TagContainer onClick={() => onTagClick(tagItem)}>
            <Icon active={active}>
                <TagIcon />
            </Icon>
            <Typography use={"body2"} tag={"div"}>
                {tagItem.tag}
            </Typography>
        </TagContainer>
    );
};
