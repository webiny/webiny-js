// @flow
import * as React from "react";
import styled from "@emotion/styled";
import Skeleton from "react-loading-skeleton";

const LoaderUl = styled("ul")({
    listStyle: "none",
    padding: "10px 20px",
    "li > div": {
        display: "inline-block",
        verticalAlign: "middle",
        ".react-loading-skeleton": {
            backgroundColor: "var(--mdc-theme-background)",
            backgroundImage:
                "linear-gradient(90deg, var(--mdc-theme-background), var(--mdc-theme-surface), var(--mdc-theme-background))"
        }
    },
    ".graphic": {
        fontSize: 36,
        width: 36
    },
    ".data": {
        width: "calc(-36px + 75%)",
        marginLeft: 10
    },
    ".actions": {
        width: "calc(-36px + 25%)",
        marginLeft: 10,
        textAlign: "right",
        "> div": {
            display: "inline-block",
            fontSize: 24,
            marginLeft: 10,
            width: 24
        }
    }
});

const Loader = () => (
    <LoaderUl>
        {[1, 2, 3, 4, 5].map(item => (
            <li key={"list-" + item}>
                <div className="graphic">
                    <Skeleton />
                </div>
                <div className="data">
                    <Skeleton count={2} />
                </div>
                <div className="actions">
                    <div>
                        <Skeleton />
                    </div>
                    <div>
                        <Skeleton />
                    </div>
                </div>
            </li>
        ))}
    </LoaderUl>
);

export default Loader;
