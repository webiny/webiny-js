import styled from "@emotion/styled";
import { css } from "@emotion/css";
import { Text } from "~/components/Text.js";
import { ActionType } from "~/types.js";

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
        // Yellow (warning).
        if (ACTION_TYPES_COLORS_MAP.YELLOW.includes(actionType)) {
            return `
                background-color: color-mix(in srgb, var(--color-warning) 6%, transparent);
                border-color: var(--color-warning);
                color: var(--color-warning);
            `;
        }

        // Red (destructive).
        if (ACTION_TYPES_COLORS_MAP.RED.includes(actionType)) {
            return `
                background-color: color-mix(in srgb, var(--color-destructive) 6%, transparent);
                border-color: var(--color-destructive);
                color: var(--color-destructive);
            `;
        }

        // Green (success).
        return `
            background-color: color-mix(in srgb, var(--color-success) 6%, transparent);
            border-color: var(--color-success);
            color: var(--color-success);
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
    color: var(--text-color-neutral-muted);
`;

export const TimezoneText = styled(TextGray)`
    padding-left: 6px;
    padding-right: 6px;
`;
