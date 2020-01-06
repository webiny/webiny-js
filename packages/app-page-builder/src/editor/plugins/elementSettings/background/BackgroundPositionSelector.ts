// @flow
import * as React from "react";
import classNames from "classnames";
import styled from "@emotion/styled";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";

const positions = [
    "top left",
    "top",
    "top right",
    "center left",
    "center",
    "center right",
    "bottom left",
    "bottom center",
    "bottom right"
];

const Ul = styled("ul")({
    listStyle: "none",
    margin: "0 auto",
    width: 100,
    textAlign: "center",
    "&.disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    },
    li: {
        display: "inline-block",
        border: "1px solid lightgray",
        width: 25,
        height: 25,
        margin: 2,
        cursor: "pointer",
        "&.active": {
            border: "1px solid gray",
            backgroundColor: "var(--mdc-theme-background)"
        }
    }
});

const PositionWrapper = styled("div")({
    width: "100%",
    display: "flex"
});

type Props = {
    disabled?: boolean,
    value: ?string,
    onChange: Function
};

const BackgroundPositionSelector = (props: Props) => {
    return (
        <PositionWrapper>
            <Typography style={{ width: "60%" }} use={"overline"}>
                Position
            </Typography>
            <Ul className={classNames({ disabled: props.disabled })}>
                {positions.map(position => (
                    <Tooltip key={position} content={<span>{position}</span>} placement={"top"}>
                        <li
                            onClick={() => props.onChange(position)}
                            className={classNames({ active: props.value === position })}
                        />
                    </Tooltip>
                ))}
            </Ul>
        </PositionWrapper>
    );
};

export default BackgroundPositionSelector;
