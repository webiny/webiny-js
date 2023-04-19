import styled from "@emotion/styled";

export const Grid = styled("div")`
    width: 100%;
    display: grid;
    /* define the number of grid columns */
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    column-gap: 16px;
    row-gap: 16px;
`;
