import styled from "@emotion/styled";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";

export const StyledAccordion = styled(Accordion)`
    background: var(--mdc-theme-background);
    box-shadow: none;
`;

export const StyledAccordionItem = styled(AccordionItem)`
    & .webiny-ui-accordion-item__content {
        background: white;
    }
`;

export const EditContainer = styled.div({
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
    box-shadow:
        var(--mdc-theme-on-background) 1px 1px 1px,
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

export const FieldContainer = styled.div({
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
