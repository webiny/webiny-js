import styled from "@emotion/styled";

import { SimpleFormFooter as BaseSimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";
import { IconButton } from "@webiny/ui/Button";
import { DrawerRight } from "@webiny/ui/Drawer";

export const CloseButton = styled(IconButton)`
    position: absolute;
    top: 15px;
`;

export const DrawerContainer = styled(DrawerRight)`
    width: 1000px;

    .mdc-list-item {
        margin: 0 0;
        padding: 0 0;
        font-size: 1rem;

        .webiny-ui-accordion-item__content {
            border: 0 !important;
        }

        &:nth-of-type(1) {
            margin-top: 0;
        }

        .mdc-list-item__meta {
            margin-left: auto !important;
            margin-right: 0 !important;
        }
    }
`;

export const SimpleFormFooter = styled(BaseSimpleFormFooter)`
    justify-content: space-between;
`;
