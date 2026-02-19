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

export const ConfigInput = styled.input`
    padding: 6px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    font-family: monospace;

    &:focus {
        outline: none;
        border-color: #1976d2;
        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
    }
`;

export const SplitPane = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
`;

export const EditorContainer = styled.div`
    flex: 1;
    position: relative;
    border-right: 1px solid #e0e0e0;
`;

export const OutputContainer = styled.div`
    width: 40%;
    min-width: 300px;
    background: #fff;
    display: flex;
    flex-direction: column;

    @media (max-width: 900px) {
        width: 50%;
    }
`;
