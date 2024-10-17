import styled from "@emotion/styled";
import { css } from "emotion";
import { Text } from "~/components/Text";
import { ActionType } from "~/types";

const ACTION_TYPES_COLORS_MAP = {
    YELLOW: [ActionType.UPDATE],
    RED: [ActionType.DELETE, ActionType.UNPUBLISH, ActionType.MOVE_TO_TRASH]
};

export const ActionWrapper = styled.div<{ value: ActionType }>`
    padding: 0 8px;
    width: fit-content;
    border: 1px solid;
    border-radius: 5px;

    ${({ value: actionType }) => {
        // Yellow.
        if (ACTION_TYPES_COLORS_MAP.YELLOW.includes(actionType)) {
            return `
                background-color: #fac42810;
                border-color: #fac428;
                color: #fac428;
            `;
        }

        // Red.
        if (ACTION_TYPES_COLORS_MAP.RED.includes(actionType)) {
            return `
                background-color: #ff000010;
                border-color: #ff0000;
                color: #ff0000;
            `;
        }

        // Green.
        return `
            background-color: #00ccb010;
            border-color: #00ccb0;
            color: #00ccb0;
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
    color: "#616161";
`;

export const TimezoneText = styled(TextGray)`
    padding-left: 6px;
    padding-right: 6px;
`;
