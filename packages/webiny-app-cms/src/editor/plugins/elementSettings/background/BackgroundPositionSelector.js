// @flow
import * as React from "react";
import classNames from "classnames";
import styled from "react-emotion";

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
    width: 200,
    textAlign: "center",
    "&.disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    },
    li: {
        display: "inline-block",
        border: "1px solid lightgray",
        width: 48,
        height: 48,
        margin: 2,
        cursor: "pointer",
        "&.active": {
            border: "1px solid gray"
        }
    }
});

type Props = {
    disabled?: boolean,
    value: ?string,
    onChange: Function
};

const BackgroundPositionSelector = (props: Props) => {
    return (
        <Ul className={classNames({ disabled: props.disabled })}>
            {positions.map(position => (
                <li
                    key={position}
                    onClick={() => props.onChange(position)}
                    className={classNames({ active: props.value === position })}
                />
            ))}
        </Ul>
    );
};

export default BackgroundPositionSelector;
