// @flow
import React from "react";
import { Query } from "react-apollo";
import { listTags } from "./graphql";
import { get } from "lodash";
import { css } from "emotion";
import { Icon } from "webiny-ui/Icon";
import styled from "react-emotion";

import { ReactComponent as TagIcon } from "./icons/round-label-24px.svg";

const style = {
    leftDrawer: css({
        float: "left",
        background: "white",
        display: "inline-block",
        width: 250,
        height: "100%",
        padding: 10
    }),
    noTagged: css({
        paddingTop: 100,
        textAlign: "center"
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
    svg: {
        color: "var(--mdc-theme-on-surface)",
        marginRight: 10
    },
    "&:hover": {
        backgroundColor: "var(--mdc-theme-background)"
    }
});

function LeftSidebar({ onTagClick, queryParams: { search } }) {
    const searchWords = typeof search === "string" ? search.split(" ") : [];

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

                    const availableTags = list.filter(item => !searchWords.includes(item));

                    if (availableTags.length > 0) {
                        return (
                            <TagList>
                                {availableTags.map(
                                    (item, index) =>
                                        !searchWords.includes(item) && (
                                            <Tag
                                                key={item + index}
                                                onClick={() => onTagClick(item)}
                                            >
                                                <Icon icon={<TagIcon />} /> {item}
                                            </Tag>
                                        )
                                )}
                            </TagList>
                        );
                    }

                    return <div className={style.noTagged}>No available tags.</div>;
                }}
            </Query>
        </div>
    );
}

export default LeftSidebar;
