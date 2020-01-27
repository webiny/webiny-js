import React from "react";
import { I18NValue } from "@webiny/app-i18n/components";

const Button = ({ children, onClick, disabled = false, loading = false }) => {
    return (
        <div className="webiny-cognito-button">
            <button
                className={
                    "webiny-cognito-button__element webiny-cognito-button__element--default" +
                    (loading ? " webiny-cognito-button--loading" : "")
                }
                onClick={onClick}
                disabled={disabled}
            >
                <I18NValue value={children} default="Submit" />
            </button>
        </div>
    );
};

export default Button;
