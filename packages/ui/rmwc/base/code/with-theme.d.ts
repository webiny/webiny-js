import * as RMWC from '@rmwc/types';
import * as React from 'react';
export interface WithThemeProps {
    theme?: RMWC.ThemePropT;
    className?: string;
}
/**
 * Actually parses the theme options
 */
export declare const parseThemeOptions: (theme: string | string[]) => string[];
/**
 * HOC that adds themeability to any component
 */
export declare const withTheme: <P extends any>(Component: React.ComponentType<any>) => React.ComponentType<any>;
