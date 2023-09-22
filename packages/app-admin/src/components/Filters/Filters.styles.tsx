import styled from "@emotion/styled";
import { Grid } from "@webiny/ui/Grid";

export const FiltersContainer = styled(Grid)`
    width: 100%;
    height: auto;
    background-color: var(--mdc-theme-surface);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    padding: 8px;
`;

interface CellInnerProps {
    align: "left" | "center" | "right";
}

export const CellInner = styled(`div`)<CellInnerProps>`
    text-align: ${props => props.align || "left"};
`;

export const FormContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    width: 100%;
`;

export const FilterContainer = styled.div`
    padding: 8px;
    align-items: center;
    display: flex;
`;
