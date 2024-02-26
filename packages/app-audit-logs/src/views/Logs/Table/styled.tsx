import styled from "@emotion/styled";
import { css } from "emotion";

import { Text } from "~/components/Text";

export const ActionWrapper = styled("div")<{ value: string }>`
    padding: 0px 8px;
    width: fit-content;
    border: 1px solid;
    border-radius: 5px;

    ${({ value, theme }) => {
        if (value === "CREATE" || value === "PUBLISH" || value === "SUCCESS") {
            return `
                background-color: ${theme.styles.colors.color2}10;
                border-color: ${theme.styles.colors.color2};
                color: ${theme.styles.colors.color2};
            `;
        }

        if (value === "UPDATE") {
            return `
                background-color: #fac42810;
                border-color: #fac428;
                color: #fac428;
            `;
        }

        if (value === "DELETE" || value === "UNPUBLISH" || value === "UNSUCCESS") {
            return `
                background-color: #ff000010;
                border-color: #ff0000;
                color: #ff0000;
            `;
        }

        return `
            background-color: ${theme.styles.colors.color4}10;
            border-color: ${theme.styles.colors.color4};
            color: ${theme.styles.colors.color4};
        `;
    }}
`;

export const wideColumn = css`
    width: auto !important;
`;

export const appColumn = css`
    width: 280px !important;
`;

export const previewColumn = css`
    width: 100px !important;
`;

export const TextGray = styled(Text)`
    color: ${({ theme }) => theme.styles.colors["color4"]};
`;

export const TimezoneText = styled(TextGray)`
    padding-left: 6px;
    padding-right: 6px;
`;
