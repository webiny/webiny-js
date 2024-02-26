import styled from "@emotion/styled";
import { css } from "emotion";

export const PayloadWrapper = styled("div")`
    #brace-editor {
        height: 280px !important;
    }

    .ace_print-margin,
    .ace_active-line,
    .ace_gutter-active-line,
    .ace_cursor-layer {
        display: none;
    }

    .ace_line,
    .ace_gutter-cell {
        height: 12px !important;
    }

    .ace_gutter-layer {
        width: 47px !important;
    }
`;

export const previewDialog = css`
    & .mdc-dialog__surface {
        width: 800px;
        min-width: 800px;
    }
`;
