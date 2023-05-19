import styled from "@emotion/styled";

export const ElementStatusWrapper = styled.div`
    padding: 16px;
    display: grid;
    row-gap: 16px;
    justify-content: center;
    align-items: center;
    text-align: center;
    background-color: var(--mdc-theme-background);
    border: 3px dashed var(--mdc-theme-on-background);
    border-radius: 5px;

    & .info-wrapper {
        display: flex;
        align-items: center;
        text-align: start;
        font-size: 10px;

        & svg {
            width: 18px;
            margin-right: 5px;
        }
    }

    & strong {
        font-weight: bold;
    }
`;
