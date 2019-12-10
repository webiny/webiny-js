import React from "react";
import { I18NValue } from "@webiny/app-i18n/components";

const Button = ({ children, onClick, disabled, loading }) => {
    return (
        <div className="webiny-cognito-button-container">
            <button
                className={
                    "webiny-cognito-button webiny-cognito-button--default" +
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
