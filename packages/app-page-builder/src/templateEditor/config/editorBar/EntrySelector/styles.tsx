import styled from "@emotion/styled";
import { DialogContent as BaseDialogContent } from "@webiny/app-headless-cms/admin/components/Dialog";

export const EntrySelectorWrapper = styled.div`
    width: 400px;
`;

export const SelectEntry = styled.div`
    position: relative;
    width: 100%;
    height: 25px;

    margin-left: 15px;
    padding: 10px 13px;

    cursor: pointer;

    background-color: #e6e6e6;
    opacity: 0.5;

    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const SelectedEntryTitle = styled.span`
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    color: #000000;
`;

export const SelectedEntryLable = styled.span`
    font-weight: 400;
    font-size: 12px;
    line-height: 15px;
    color: #4b4b4b;
`;

export const SelectedEntryLeft = styled.div`
    display: flex;
    flex-direction: column;
`;

export const SelectedEntryRight = styled.div``;

export const Container = styled.div`
    width: 100%;
    box-sizing: border-box;
    padding: 20px;
`;

export const Content = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    position: relative;
    width: 100%;
    min-height: 20px;
    box-sizing: border-box;
    padding: 20px 0 20px 20px;
    background-color: var(--mdc-theme-background);
    border: 1px solid var(--mdc-theme-on-background);
    overflow-x: hidden;
`;

export const DialogContent = styled(BaseDialogContent)`
    padding: 0 !important;
`;
