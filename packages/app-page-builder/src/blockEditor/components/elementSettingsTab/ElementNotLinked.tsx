import React from "react";
import styled from "@emotion/styled";
import { ButtonPrimary } from "@webiny/ui/Button";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";
import CreateVariableAction from "~/blockEditor/plugins/elementSettings/CreateVariableAction";

const ElementNotLinkedWrapper = styled("div")({
    padding: "16px",
    display: "grid",
    rowGap: "16px",
    justifyContent: "center",
    alignItems: "center",
    margin: "16px",
    textAlign: "center",
    backgroundColor: "var(--mdc-theme-background)",
    border: "3px dashed var(--webiny-theme-color-border)",
    borderRadius: "5px",
    "& .info-wrapper": {
        display: "flex",
        alignItems: "center",
        fontSize: "10px",
        "& svg": {
            width: "18px",
            marginRight: "5px"
        }
    }
});

const ElementNotLinked = () => {
    return (
        <ElementNotLinkedWrapper>
            <strong>Element not linked</strong>
            To allow users to change the value of this element inside a page, you need to link it to
            a variable.
            <div>
                <CreateVariableAction>
                    <ButtonPrimary>Create variable</ButtonPrimary>
                </CreateVariableAction>
            </div>
            <div className="info-wrapper">
                <InfoIcon /> Click here to learn more about how block variables work
            </div>
        </ElementNotLinkedWrapper>
    );
};

export default ElementNotLinked;
