import styled from "@emotion/styled";

export const TimestampFiltersContainer = styled.div`
    display: flex;
    column-gap: 16px;

    .mdc-text-field:first-of-type {
        height: 40px !important;

        input:before {
            content: "From:";
            margin-right: 8px;
        }
    }

    .mdc-text-field:last-of-type {
        height: 40px !important;

        input:before {
            content: "To:";
            margin-right: 8px;
        }
    }
`;
