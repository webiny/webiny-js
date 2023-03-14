import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import Accordion from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Accordion";
// assets
import { ReactComponent as UploadInProgressIcon } from "../../../icons/undraw-uploading.svg";
import { ReactComponent as ExportInProgressIcon } from "../../../icons/undraw_export_files.svg";
import { ReactComponent as CircleIcon } from "@material-design-icons/svg/round/check_circle.svg";
import { ReactComponent as CancelIcon } from "@material-design-icons/svg/round/cancel.svg";

export const ShowDetails = {
    Container: styled.div`
        margin-top: 24px;
    `,
    Accordion: styled(Accordion)`
        border: 1px solid var(--mdc-theme-on-background);
    `,
    Label: styled(Typography)`
        display: inline-block;
        color: var(--mdc-theme-text-secondary-on-background);
        padding-bottom: 8px;
    `,
    List: styled.ul`
        list-style-position: inside;
        list-style-type: circle;
    `,
    ListItem: styled.li`
        padding-bottom: 8px;
    `,
    LinkText: styled(Typography)`
        margin-left: 8px;
    `
};

export const LoadingDialog = {
    Wrapper: styled.div`
        display: flex;
        width: 600px;
    `,

    WrapperLeft: styled.div`
        flex: 1 0 calc(50% - 24px);
        padding: 24px 24px 24px 0;
    `,

    WrapperRight: styled.div`
        flex: 1 0 50%;
    `,

    TitleContainer: styled.div`
        display: flex;
        align-items: center;
        margin-bottom: 24px;
    `,

    Pulse: styled.div`
        display: flex;
        margin-right: 16px;
        --blob-size: 20px;
        --pulse-color-alpha10: rgba(52, 172, 224, 1);
        --pulse-color-alpha7: rgba(52, 172, 224, 0.7);
        --pulse-color-alpha0: rgba(52, 172, 224, 0);

        & .inner {
            border-radius: 50%;
            height: var(--blob-size);
            width: var(--blob-size);
            transform: scale(1);
            background: var(--pulse-color-alpha10);
            box-shadow: 0 0 0 0 var(--pulse-color-alpha10);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 var(--pulse-color-alpha7);
            }

            70% {
                transform: scale(1);
                box-shadow: 0 0 0 10px var(--pulse-color-alpha0);
            }

            100% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 var(--pulse-color-alpha0);
            }
        }
    `,
    StatsContainer: styled.div`
        display: flex;
    `,
    StatusContainer: styled.div`
        display: flex;
        flex-direction: column;
        padding-right: 24px;
    `,
    StatusTitle: styled(Typography)`
        color: var(--mdc-theme-text-secondary-on-background);
    `,
    StatusBody: styled(Typography)`
        text-transform: capitalize;
    `,
    ProgressContainer: styled.div`
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    `,
    UploadIllustration: styled(UploadInProgressIcon)`
        width: 100%;
        max-width: 300px;
        height: auto;
    `,
    ExportIllustration: styled(ExportInProgressIcon)`
        width: 100%;
        max-width: 300px;
        height: auto;
    `,
    CheckMarkIcon: styled(CircleIcon)`
        margin-right: 16px;
        fill: var(--mdc-theme-secondary);
    `,
    CancelIcon: styled(CancelIcon)`
        margin-right: 16px;
        fill: var(--mdc-theme-error);
    `
};
