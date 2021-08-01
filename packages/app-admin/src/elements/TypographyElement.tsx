import React from "react";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";
import { Typography } from "@webiny/ui/Typography";

export type TypographyT =
    | "headline1"
    | "headline2"
    | "headline3"
    | "headline4"
    | "headline5"
    | "headline6"
    | "subtitle1"
    | "subtitle2"
    | "body1"
    | "body2"
    | "caption"
    | "button"
    | "overline";

interface TypographyElementConfig extends ElementConfig {
    typography: TypographyT;
}

export class TypographyElement extends Element<TypographyElementConfig> {
    constructor(id: string, config: TypographyElementConfig) {
        super(id, config);
        this.toggleGrid(false);

        this.applyPlugins(TypographyElement);
    }

    getTypography() {
        return this.config.typography;
    }

    setTypography(typography: TypographyT) {
        this.config.typography = typography;
    }

    render(props: any): React.ReactNode {
        return <Typography use={this.getTypography()}>{super.render(props)}</Typography>;
    }
}
