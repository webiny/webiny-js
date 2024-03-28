import styled from "@emotion/styled";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { ButtonSecondary } from "@webiny/ui/Button";
import { Select } from "@webiny/ui/Select";

export const StyledAccordion = styled(Accordion)<{ margingap?: string }>`
    background: white;
    box-shadow: none;
    & > ul {
        padding: 0 0 0 0 !important;
    }
    ${props => `margin-top: ${props.margingap}`}
`;

export const AccordionWithShadow = styled(Accordion)<{ margingap?: string }>`
    background: ${props => props.theme.styles.colors["color6"]};
    & > ul {
        padding: 0 0 0 0 !important;
    }
    ${props => `margin-top: ${props.margingap}`}
`;

export const StyledAccordionItem = styled(AccordionItem)`
    & .webiny-ui-accordion-item__content {
        background: white;
    }
`;

export const RulesTag = styled.div<{ isValid: boolean }>`
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
    margin-top: 15px;
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

export const StyledAddRuleButton = styled(ButtonSecondary)`
    width: 150px;
`;

export const AddConditionButton = styled("div")`
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
`;

export const ConditionsChainSelect = styled(Select)`
    width: 250px;
    margin-left: 80px;
`;

export const DefaultBehaviourWrapper = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    & .webiny-ui-select {
        width: 350px;
        margin-left: 40px;
    }
`;

export const EditContainer = styled("div")({
    padding: 40,
    position: "relative"
});

export const RowContainer = styled.div<{ isDragging?: boolean }>`
    position: relative;
    display: flex;
    flex-direction: column;
    margin-bottom: 25px;

    &:last-child {
        margin-bottom: 0px;
    }

    border-radius: 2px;
    background-color: var(--mdc-theme-surface);
    box-shadow: var(--mdc-theme-on-background) 1px 1px 1px,
        var(--mdc-theme-on-background) 1px 1px 2px;

    border: 1px solid var(--mdc-theme-background);
    box-shadow: none;

    opacity: ${props => (props.isDragging ? 0.3 : 1)};
`;

export const Wrapper = styled.div`
    margin-left: 40px;
`;

export const Row = styled.div({
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

export const ConditionGroupContainer = styled.div({
    position: "relative",
    flex: "1 100%",
    backgroundColor: "white",
    padding: "0 15px",
    margin: 10,
    transition: "box-shadow 225ms",
    color: "var(--mdc-theme-on-surface)",
    cursor: "grab",
    "&:hover": {
        boxShadow:
            "var(--mdc-theme-on-background) 1px 1px 1px, var(--mdc-theme-on-background) 1px 1px 2px"
    }
});

export const FieldContainer = styled.div<{ noPadding?: boolean }>`
    padding: ${props => (props.noPadding ? "0" : "0 15px")};
    position: relative;
    flex: 1 100%;
    background-color: var(--mdc-theme-background);
    margin: 10px;
    border-radius: 2px;
    border: 1px solid var(--mdc-theme-on-background);
    transition: box-shadow 225ms;
    color: var(--mdc-theme-on-surface);
    cursor: grab;
    & :hover {
        box-shadow: var(--mdc-theme-on-background) 1px 1px 1px,
            var(--mdc-theme-on-background) 1px 1px 2px;
    }
`;

export const RowHandle = styled.div({
    width: 30,
    cursor: "grab",
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
    color: "var(--mdc-theme-on-surface)"
});

export const FieldHandle = styled.div({
    cursor: "grab"
});
