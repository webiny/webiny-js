import React from "react";
import { Alert } from "@webiny/ui/Alert";

export const CannotUseAaclAlert: React.FC = () => {
    return (
        <Alert title={"Advanced Access Control Layer (AACL) not activated"} type={"warning"}>
            <strong>Custom access</strong> option cannot be used because the Advanced Access Control
            Layer (AACL) is not activated. <br />
            <br />
            To learn more, please visit the official&nbsp;
            <a href={"https://www.webiny.com/docs/wcp/overview"} target={"_blank"}>documentation</a>.
        </Alert>
    );
};
