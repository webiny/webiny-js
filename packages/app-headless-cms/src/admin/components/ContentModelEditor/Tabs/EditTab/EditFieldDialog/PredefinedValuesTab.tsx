// TODO remove
// @ts-nocheck
import React, { useState, useCallback, Fragment } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import LocaleSelector from "./LocaleSelector";
import PredefinedValues from "./PredefinedValuesTab/PredefinedValues";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

const PredefinedValuesTab = props => {
    const i18n = useI18N();

    const [locale, setLocale] = useState(i18n.getLocale().id);
    const getLocale = useCallback(() => locale, [locale]);

    return (
        <Fragment>
            <Grid>
                <Cell span={12}>
                    <LocaleSelector locale={getLocale()} setLocale={setLocale} />
                </Cell>
            </Grid>

            <PredefinedValues {...props} locale={locale} />
        </Fragment>
    );
};

export default PredefinedValuesTab;
