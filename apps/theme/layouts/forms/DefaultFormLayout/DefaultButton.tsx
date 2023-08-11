import React from "react";
import styled from "@emotion/styled";

export const Wrapper = styled.div`
    ${props => props.theme.styles.elements["button"]["default"]}
    .button-body {
        margin-left: auto;

        &:disabled {
            opacity: 0.5;
        }
    }
`;

interface Props {
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
}

export const DefaultButton: React.FC<Props> = ({ onClick, disabled = false, children }) => {
    return (
        <Wrapper>
            <button className={"button-body"} onClick={onClick} disabled={disabled}>
                {children}
            </button>
        </Wrapper>
    );
};
