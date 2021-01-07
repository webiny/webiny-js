import React from "react";

const CircularSpinner = ({ label }) => {
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
