import React from "react";

import { Snackbar } from "@webiny/ui/Snackbar";

export interface FeedbackProps {
    isOpen: boolean;
    message: string;
}

export const Feedback = (props: FeedbackProps) => {
    return (
        <>
            {JSON.stringify(props)}
            <Snackbar open={props.isOpen} message={props.message} />
        </>
    );
};
