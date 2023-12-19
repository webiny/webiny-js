import React from "react";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as TopIcon } from "./icons/round-border_top-24px.svg";
import { ReactComponent as RightIcon } from "./icons/round-border_right-24px.svg";
import { ReactComponent as BottomIcon } from "./icons/round-border_bottom-24px.svg";
import { ReactComponent as LeftIcon } from "./icons/round-border_left-24px.svg";

const enabled = css({
    color: "var(--mdc-theme-primary, #fa5723) !important"
});

const cellStyle = { marginBottom: 0 };

const getValue = (value: Record<string, boolean>, side: string): boolean => {
    const enabled = value[side];
    return typeof enabled === "undefined" ? true : enabled;
};

interface SelectorPropsType {
    label: string;
    value: Record<string, boolean>;
    updateValue: (value: any) => void;
}
const Selector = ({ label, value, updateValue }: SelectorPropsType) => {
    const top = getValue(value, "top");
    const right = getValue(value, "right");
    const bottom = getValue(value, "bottom");
    const left = getValue(value, "left");

    return (
        <Grid>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <Grid>
                    <Cell span={3} style={cellStyle}>
                        <IconButton
                            onClick={() => updateValue({ ...value, top: !top })}
                            className={top ? enabled : ""}
                            icon={<TopIcon />}
                        />
                    </Cell>
                    <Cell span={3} style={cellStyle}>
                        <IconButton
                            onClick={() => updateValue({ ...value, right: !right })}
                            className={right ? enabled : ""}
                            icon={<RightIcon />}
                        />
                    </Cell>
                    <Cell span={3} style={cellStyle}>
                        <IconButton
                            onClick={() => updateValue({ ...value, bottom: !bottom })}
                            className={bottom ? enabled : ""}
                            icon={<BottomIcon />}
                        />
                    </Cell>
                    <Cell span={3} style={cellStyle}>
                        <IconButton
                            onClick={() => updateValue({ ...value, left: !left })}
                            className={left ? enabled : ""}
                            icon={<LeftIcon />}
                        />
                    </Cell>
                </Grid>
            </Cell>
        </Grid>
    );
};

export default React.memo(Selector);
