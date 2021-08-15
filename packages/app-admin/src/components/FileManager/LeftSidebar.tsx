import React from "react";
import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import sortBy from "lodash/sortBy";
import { css } from "emotion";
import styled from "@emotion/styled";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as TagIcon } from "./icons/round-label-24px.svg";
import { LIST_TAGS } from "./graphql";

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

function LeftSidebar({ toggleTag, queryParams: { tags } }) {
    const activeTags = Array.isArray(tags) ? tags : [];

    const { data } = useQuery(LIST_TAGS);

    const list = get(data, "fileManager.listTags") || [];

    if (list.length === 0) {
        return (
            <div className={style.leftDrawer} data-testid={"fm.left-drawer.empty-tag"}>
                <div className={style.noTagged}>
                    Once you tag an image, the tag will be displayed here.
                </div>
            </div>
        );
    }
    // Sort "tags" list in "ASC" order.
    const tagList = sortBy(list);

    return (
        <div className={style.leftDrawer}>
            <TagList data-testid={"fm.left-drawer.tag-list"}>
                {tagList.map((item, index) => (
                    <Tag
                        className={activeTags.includes(item) && "active"}
                        key={item + index}
                        onClick={() => toggleTag(item)}
                    >
                        <Icon icon={<TagIcon />} /> {item}
                    </Tag>
                ))}
            </TagList>
        </div>
    );
}

export default LeftSidebar;
