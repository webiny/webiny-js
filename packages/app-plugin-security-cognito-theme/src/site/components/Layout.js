import React from 'react';
import classNames from 'classnames';

export function ViewContainer({logo, children}) {
  return (
    <div className="webiny-cognito-view">
      <div className="webiny-cognito-view__logo-bar">
        <img src={logo} alt="Logo" />
      </div>
      {children}
    </div>
  );
}

export function Content({children}) {
  return <div className={'webiny-cognito-view__content'}>{children}</div>;
}

export function Header({children, title}) {
  return (
    <div className={'webiny-cognito-view__header'}>
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}

export function Row({children, alignRight, alignCenter}) {
  const classes = {
    'webiny-cognito-view__row': true,
    'webiny-cognito-view__row--align-right': alignRight,
    'webiny-cognito-view__row--align-center': alignCenter,
  };

  return <div className={classNames (classes)}>{children}</div>;
}

export function Loading () {
  return <div className="webiny-cognito-view__loading" />;
}

export function Alert({title, type = 'danger', children}) {
  const classes = {
    'webiny-cognito-alert': true,
    'webiny-cognito-alert--danger': type === 'danger',
    'webiny-cognito-alert--info': type === 'info',
  };

  return (
    <div className={classNames (classes)}>
      <p className={'webiny-cognito-alert__title'}>{title}</p>
      <p className={'webiny-cognito-alert__message'}>{children}</p>
    </div>
  );
}
