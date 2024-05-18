import styled from "@emotion/styled";

export const TimestampFiltersContainer = styled.div`
    display: flex;
    column-gap: 16px;
    flex-grow: 1;

    .mdc-text-field:first-of-type {
        height: 40px !important;
        position: relative;
        min-width: 225px;

        input {
            text-indent: 20px;
        }

        input:before {
            text-indent: 0;
            content: "From:";
            margin-left: -25px;
            position: absolute;
        }
    }

    .mdc-text-field:last-of-type {
        height: 40px !important;
        position: relative;
        min-width: 205px;

        input {
            text-indent: 10px;
        }

        input:before {
            text-indent: 0;
            content: "To:";
            margin-left: -15px;
            position: absolute;
        }
    }
`;
