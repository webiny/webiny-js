// @flow
import * as React from "react";
import { DelayedOnChange } from "webiny-app-page-builder/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import MetaTags from "./MetaTags";

type Props = {
    Bind: React.ComponentType<*>
};

const SocialSettings = ({ Bind }: Props) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.seo.title"}>
                        <DelayedOnChange>
                            <Input label="Title" description="SEO title" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
            </Grid>
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.seo.description"}>
                        <DelayedOnChange>
                            <Input rows={4} label="Description" description="SEO description" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
            </Grid>
            <Bind name={"settings.seo.meta"} defaultValue={[]}>
                {props => <MetaTags prefix={"settings.seo.meta"} Bind={Bind} {...props} />}
            </Bind>
        </React.Fragment>
    );
};

export default SocialSettings;
