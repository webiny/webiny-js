import React from "react";
import sortBy from "lodash/sortBy";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as TagIcon } from "@material-design-icons/svg/outlined/label.svg";
import { useFileManagerView } from "~/index";

const style = {
    leftDrawer: css({
        float: "left",
        display: "inline-block",
        width: 250,
        height: "100%",
        backgroundColor: "var(--mdc-theme-surface)",
        padding: 10
    }),
    noTagged: css({
        paddingTop: 100,
        textAlign: "center",
        color: "var(--mdc-theme-on-surface)"
    })
};

const TagList = styled("div")({
    display: "flex",
    flexDirection: "column"
});

const Tag = styled("div")({
    display: "flex",
    flexDirection: "row",
    height: 40,
    alignItems: "center",
    cursor: "pointer",
    paddingLeft: 15,
    color: "var(--mdc-theme-on-surface)",
    svg: {
        color: "var(--mdc-theme-on-surface)",
        marginRight: 10
    },
    "&:hover": {
        backgroundColor: "var(--mdc-theme-background)"
    },
    "&.active": {
        svg: {
            color: "var(--mdc-theme-secondary)"
        }
    }
});

interface LeftSidebarProps {
    toggleTag: (item: string) => void;
}
const LeftSidebar = ({ toggleTag }: LeftSidebarProps) => {
    const { queryParams, tags } = useFileManagerView();
    const activeTags = Array.isArray(queryParams.tags) ? queryParams.tags : [];

    if (tags.length === 0) {
        return (
            <div className={style.leftDrawer} data-testid={"fm.left-drawer.empty-tag"}>
                <div className={style.noTagged}>
                    Once you tag a file, the tag will be displayed here.
                </div>
            </div>
        );
    }

    // Sort "tags" list in "ASC" order.
    const sortedTags = sortBy(tags);

    return (
        <div className={style.leftDrawer}>
            <TagList data-testid={"fm.left-drawer.tag-list"}>
                {sortedTags.map((tag, index) => {
                    const className = activeTags.includes(tag) ? "active" : "";
                    return (
                        <Tag className={className} key={tag + index} onClick={() => toggleTag(tag)}>
                            <Icon icon={<TagIcon />} /> {tag}
                        </Tag>
                    );
                })}
            </TagList>
        </div>
    );
};

export default LeftSidebar;
