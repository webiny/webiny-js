import React from "react";
import { I18NValue } from "@webiny/app-i18n/components";

type ButtonProps = {
    children: string;
    onClick(e: React.SyntheticEvent): void;
    disabled?: boolean;
    loading?: boolean;
};

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled, loading }) => {
    return (
        <div className="webiny-cognito-button">
            <button
                className={
                    "webiny-cognito-button__element webiny-cognito-button__element--primary" +
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
