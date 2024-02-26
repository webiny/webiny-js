import React from "react";

import { ReactComponent as TagIconOutlined } from "@material-design-icons/svg/outlined/label.svg";
import { ReactComponent as TagIconRound } from "@material-design-icons/svg/round/label.svg";
import { TagItem } from "@webiny/app-aco/types";
import { Typography } from "@webiny/ui/Typography";
import { TagContainer, Icon } from "./styled";

type TagProps = {
    tagItem: TagItem;
    active: boolean;
    onTagClick: (tagItem: TagItem) => void;
};

export const Tag = ({ tagItem, active, onTagClick }: TagProps) => {
    return (
        <TagContainer onClick={() => onTagClick(tagItem)}>
            <Icon active={active}>{active ? <TagIconRound /> : <TagIconOutlined />}</Icon>
            <Typography use={"body2"} tag={"div"}>
                {tagItem.tag}
            </Typography>
        </TagContainer>
    );
};
