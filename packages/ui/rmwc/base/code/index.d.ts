import { WithThemeProps as _WithThemeProps } from './with-theme';
import { FoundationProps as _FoundationProps } from './foundation-component';
import { FocusTrap as _FocusTrap } from 'focus-trap';
import _createFocusTrap from 'focus-trap';
export { default as classNames } from 'classnames';
export * from './with-theme';
export * from './utils';
export { FoundationComponent } from './foundation-component';
export { componentFactory } from './component';
export declare const createFocusTrap: typeof _createFocusTrap;
export declare type WithThemeProps = _WithThemeProps;
export interface FoundationProps extends _FoundationProps {
}
export interface FocusTrap extends _FocusTrap {
}
