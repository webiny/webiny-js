import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";

export interface ReviewListNoticeProps {
    message: string;
    onShow: () => void;
}

// "New reviews are available." with Show (QBZ-71, QBZ-86).
export const ReviewListNotice = ({ message, onShow }: ReviewListNoticeProps) => {
    return (
        <Alert
            role="status"
            type="info"
            variant="subtle"
            className="mb-sm"
            actions={<Alert.Action text="Show" onClick={onShow} />}
        >
            <Text>{message}</Text>
        </Alert>
    );
};
