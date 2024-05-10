import React from "react";
import { FbFormModel } from "@webiny/app-form-builder/types";
import { RichTextRenderer } from "@webiny/react-rich-text-renderer";
import styled from "@emotion/styled";

const DEFAULT_MESSAGE = "Thank you for your submission!";

const CheckmarkIcon = styled(({ className }: { className?: string }) => (
    <svg
        aria-hidden="true"
        focusable="false"
        data-prefix="far"
        data-icon="circle-check"
        className={className}
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
    >
        <path
            fill="currentColor"
            d="M243.8 339.8C232.9 350.7 215.1 350.7 204.2 339.8L140.2 275.8C129.3 264.9 129.3 247.1 140.2 236.2C151.1 225.3 168.9 225.3 179.8 236.2L224 280.4L332.2 172.2C343.1 161.3 360.9 161.3 371.8 172.2C382.7 183.1 382.7 200.9 371.8 211.8L243.8 339.8zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"
        />
    </svg>
))`
    color: #00ccb0;
    width: 100px;
    height: 100px;
`;

const Heading = styled.div(props =>
    props.theme.styles.typography["headings"].stylesById("heading1")
);
const Message = styled.div(props =>
    props.theme.styles.typography["paragraphs"].stylesById("paragraph1")
);

const Wrapper = styled.div`
    width: 100%;
    text-align: center;
`;

interface Props {
    formData: FbFormModel;
}

export const SuccessMessage = ({ formData }: Props) => {
    const heading = "Success!";

    let message;
    if (formData.settings.successMessage) {
        message = <RichTextRenderer data={formData.settings.successMessage} />;
    }

    return (
        <Wrapper>
            <CheckmarkIcon />
            <Heading>{heading}</Heading>
            <Message>{message || DEFAULT_MESSAGE}</Message>
        </Wrapper>
    );
};
