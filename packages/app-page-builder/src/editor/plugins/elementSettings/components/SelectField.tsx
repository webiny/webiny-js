import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import omit from "lodash/omit";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { COLORS } from "./StyledComponents";

const selectStyle = css({
    display: "block",
    color: COLORS.darkestGray,
    padding: ".6em 1.4em .5em .8em",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    margin: "0",
    border: `1px solid ${COLORS.gray}`,
    borderRadius: 1,
    MozAppearance: "none",
    WebkitAppearance: "none",
    appearance: "none",
    backgroundColor: COLORS.lightGray,
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
    backgroundRepeat: "no-repeat, repeat",
    backgroundPosition: "right .7em top 50%, 0 0",
    backgroundSize: "24px auto, 100%",

    "&::-ms-expand": { display: "none" },
    "&:hover:not(:disabled)": { borderColor: COLORS.darkGray, backgroundColor: COLORS.gray },
    "&:focus:not(:disabled)": {
        borderColor: COLORS.darkGray,
        outline: "none",
        backgroundColor: COLORS.gray
    },
    "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
        borderColor: COLORS.lightGray
    },
    "& option": { fontWeight: "normal" }
});

interface SelectProps {
    value?: string;
    onChange?: (value: string) => void;
    // One or more <option> or <optgroup> elements.
    children?: Array<React.ReactElement<"option"> | React.ReactElement<"optgroup">>;
    className?: string;
    [key: string]: any;
}

const SelectField = ({
    value = "",
    onChange,
    children,
    className,
    validation = { isValid: true },
    description,
    placeholder = "",
    ...props
}: SelectProps) => {
    return (
        <React.Fragment>
            <select
                className={classNames(selectStyle, className)}
                value={value}
                onChange={({ target: { value } }) => {
                    if (!onChange) {
                        return;
                    }
                    onChange(value);
                }}
                {...omit(props, "validate")}
            >
                {placeholder ? (
                    <option value="" disabled hidden>
                        {placeholder}
                    </option>
                ) : null}
                {children}
            </select>
            {validation.isValid === false && (
                <FormElementMessage error>{validation.message}</FormElementMessage>
            )}

            {validation.isValid !== false && description && (
                <FormElementMessage>{description}</FormElementMessage>
            )}
        </React.Fragment>
    );
};

export default React.memo(SelectField);
