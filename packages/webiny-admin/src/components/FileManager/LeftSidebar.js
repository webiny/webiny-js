// @flow
import React from "react";
import { Query } from "react-apollo";
import { listTags } from "./graphql";
import { get } from "lodash";
import { css } from "emotion";
import { Chip, ChipText, Chips } from "webiny-ui/Chips";

const style = {
    leftDrawer: css({
        float: "left",
        background: "white",
        display: "inline-block",
        width: 250,
        height: "100%",
        padding: 10,
        ".header": {
            textAlign: "center",
            fontSize: 18,
            padding: 10,
            fontWeight: "600",
            color: "var(--mdc-theme-on-surface)"
        },
        ".noTagged": {
            paddingTop: 100,
            textAlign: "center"
        }
    })
};

function LeftSidebar({ onTagClick }) {
    return (
        <div className={style.leftDrawer}>
            <div className="header">Tags</div>

            <Query query={listTags}>
                {({ data }) => {
                    const list = get(data, "files.listTags") || [];

                    if (!list.length) {
                        return <div className="noTagged">No assigned tags yet.</div>;
                    }

                    return (
                        <Chips>
                            {list.map((item, index) => (
                                <Chip key={item + index} onClick={() => onTagClick(item)}>
                                    <ChipText>{item}</ChipText>
                                </Chip>
                            ))}
                        </Chips>
                    );
                }}
            </Query>
        </div>
    );
}

export default LeftSidebar;
