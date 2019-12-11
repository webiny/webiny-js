import * as React from 'react';

const CircularSpinner = ({label}: Props) => {
  return (
    <div className="webiny-pb-circular-spinner">
      {process.env.REACT_APP_ENV === 'ssr'
        ? null
        : <div className="webiny-pb-circular-spinner__container">
            <div className="webiny-pb-circular-spinner__container-loader">
              Loading...
            </div>
            {label &&
              <div className="webiny-pb-circular-spinner__container-label">
                {label}
              </div>}
          </div>}
    </div>
  );
};

export default CircularSpinner;
