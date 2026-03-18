import React from "react";
import { Grid, Input } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

const PATHNAME_REGEX = new RegExp(
    `^\\/(?:[a-zA-Z0-9._~:@!$&'()*+,;=%/-])*(?:\\?[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?(?:#[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?$`
);

const validatePathname = (pathname: string) => {
    if (!pathname) {
        return;
    }

    if (PATHNAME_REGEX.test(pathname)) {
        return;
    }

    throw new Error(`Enter a valid pathname, e.g.: /path/to/page?query=value`);
};

export const SeoCanonicalUrl = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.seo.canonicalUrl"} validators={[validatePathname]}>
                <Input
                    label={"Canonical URL"}
                    description={"The canonical URL for this page"}
                />
            </Bind>
        </Grid.Column>
    );
};
