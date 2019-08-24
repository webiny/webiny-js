// @flow
import React from "react";
import { Query } from "react-apollo";
import { listTags } from "./graphql";
import { get } from "lodash";
import { css } from "emotion";
import { Icon } from "@webiny/ui/Icon";
import styled from "react-emotion";
import { ReactComponent as TagIcon } from "./icons/round-label-24px.svg";

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

    return (
        <div className={style.leftDrawer}>
            <Query query={listTags}>
                {({ data }) => {
                    const list = get(data, "files.listTags") || [];

                    if (!list.length) {
                        return (
                            <div className={style.noTagged}>
                                Once you tag an image, the tag will be displayed here.
                            </div>
                        );
                    }

                    return (
                        <TagList>
                            {list.map((item, index) => (
                                <Tag
                                    className={activeTags.includes(item) && "active"}
                                    key={item + index}
                                    onClick={() => toggleTag(item)}
                                >
                                    <Icon icon={<TagIcon />} /> {item}
                                </Tag>
                            ))}
                        </TagList>
                    );
                }}
            </Query>
        </div>
    );
}

export default LeftSidebar;
