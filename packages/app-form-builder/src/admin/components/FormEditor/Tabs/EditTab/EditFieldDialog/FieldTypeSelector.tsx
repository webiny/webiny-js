import React from "react";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";
import { Icon } from "@webiny/ui/Icon";
import { css } from "emotion";
import { FbBuilderFieldPlugin } from "~/types";
const fieldTypeBox = css({
    width: 150,
    height: 150,
    textAlign: "center",
    margin: 20,
    padding: 15,
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    cursor: "pointer",
    transition: "opacity 225ms",
    flexDirection: "column",
    backgroundColor: "var(--mdc-theme-surface) !important",
    ".webiny-ui-icon": {
        color: "var(--mdc-theme-secondary)",
        height: 50,
        transition: "color 225ms"
    },
    "&:hover": {
        opacity: 0.8,
        ".webiny-ui-icon": {
            color: "var(--mdc-theme-primary)"
        }
    }
});

interface FbFormModelFieldSelectorProps {
    fieldType: FbBuilderFieldPlugin["field"];
    onClick: (event: React.MouseEvent) => void;
}
const FbFormModelFieldSelector = ({ fieldType, onClick }: FbFormModelFieldSelectorProps) => {
    return (
        <span onClick={onClick} style={{ display: "inline-block" }}>
            <Elevation z={2} className={fieldTypeBox}>
                <Icon icon={fieldType.icon as React.ReactElement} />
                <Typography use={"headline5"}>{fieldType.label}</Typography>
                <br />
                <Typography use={"caption"}>{fieldType.description}</Typography>
            </Elevation>
        </span>
    );
};

export default FbFormModelFieldSelector;
