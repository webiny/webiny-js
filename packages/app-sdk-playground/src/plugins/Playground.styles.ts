import styled from "@emotion/styled";

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: calc(100vh - 45px);
    background: #f5f5f5;
`;

export const Toolbar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const ToolbarActions = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

export const SplitPane = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
`;

export const EditorContainer = styled.div`
    position: relative;
    overflow: hidden;
    border-right: 1px solid #e0e0e0;
`;

export const OutputContainer = styled.div`
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;
