import { css } from "emotion";
import styled from "@emotion/styled";

import { Accordion } from "@webiny/ui/Accordion";
import { ButtonSecondary } from "@webiny/ui/Button";
import { Select } from "@webiny/ui/Select";

export const EditContainer = styled("div")({
    padding: 40,
    position: "relative"
});

export const RowContainer = styled("div")({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    marginBottom: 25,
    borderRadius: 2,
    backgroundColor: "var(--mdc-theme-surface)",
    border: "1px solid var(--mdc-theme-on-background)",
    boxShadow:
        "var(--mdc-theme-on-background) 1px 1px 1px, var(--mdc-theme-on-background) 1px 1px 2px"
});

export const Row = styled("div")({
    display: "flex",
    flexDirection: "row",
    backgroundColor: "var(--mdc-theme-surface)",
    paddingLeft: 40,
    paddingRight: 10,
    position: "relative",
    // We need this because on the smaller screens fourth field in the row shifts out of the row container,
    // so it breaks the layout.
    overflowX: "auto"
});

export const fieldContainer = css({
    position: "relative",
    flex: "1 100%",
    backgroundColor: "var(--mdc-theme-background)",
    padding: "0 15px",
    margin: 10,
    borderRadius: 2,
    border: "1px solid var(--mdc-theme-on-background)",
    transition: "box-shadow 225ms",
    color: "var(--mdc-theme-on-surface)",
    cursor: "grab",
    "&:hover": {
        boxShadow:
            "var(--mdc-theme-on-background) 1px 1px 1px, var(--mdc-theme-on-background) 1px 1px 2px"
    }
});

export const conditionGroupContainer = css({
    position: "relative",
    flex: "1 100%",
    backgroundColor: "none",
    padding: "0 15px",
    margin: 10,
    borderRadius: 2,
    border: "none",
    transition: "box-shadow 225ms",
    color: "var(--mdc-theme-on-surface)",
    cursor: "grab",
    "&:hover": {
        boxShadow: "none"
    }
});

export const rowHandle = css({
    width: 30,
    cursor: "grab",
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
    color: "var(--mdc-theme-on-surface)"
});

export const fieldHandle = css({
    cursor: "grab"
});

export const StepRulesTag = styled.div<{ isValid: boolean }>`
    display: inline-block;
    padding: 5px 20px 7px 20px;
    background-color: white;
    border-radius: 5px;
    border: 1px solid;
    border-color: ${props =>
        props.isValid ? props.theme.styles.colors.color4 : props.theme.styles.colors.color1};
    margin-right: 10px;
    cursor: default;
    font-size: 16px;
    font-weight: normal;
    color: ${props =>
        props.isValid ? props.theme.styles.colors.color4 : props.theme.styles.colors.color1};
`;

export const RulesTabWrapper = styled.div`
    margin: 20px 20px;

    display: flex;
    flex-direction: column;
`;

export const AddRuleButtonWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

export const RuleButtonDescription = styled.div`
    display: flex;
    align-items: center;

    margin-top: 5px;

    & > span {
        margin-left: 5px;
        font-size: 14px;
    }
`;

export const StyledAccordion = styled(Accordion)`
    margin-bottom: 15px;

    & > ul:first-child:last-child {
        padding: 0px 0px !important;
    }
`;

export const ConditionSetupWrapper = styled.div``;

export const AddRuleButton = styled(ButtonSecondary)`
    width: 150px;
`;

export const AddConditionButton = styled(ButtonSecondary)`
    border: none;
    margin-left: 70px;
`;

export const ConditionsChainSelect = styled(Select)`
    width: 250px;
    margin-left: 80px;
`;
