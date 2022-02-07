import React from "react";

interface CircularSpinnerProps {
    label: string;
}
const CircularSpinner: React.FC<CircularSpinnerProps> = ({ label }) => {
    return (
        <div className="webiny-pb-circular-spinner">
            <div className="webiny-pb-circular-spinner__container">
                <div className="webiny-pb-circular-spinner__container-loader">Loading...</div>
                {label && (
                    <div className="webiny-pb-circular-spinner__container-label">{label}</div>
                )}
            </div>
        </div>
    );
};

export default CircularSpinner;
