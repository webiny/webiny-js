import * as React from "react";
import { DelayedOnChange } from "../../../components/DelayedOnChange";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import OpenGraphTags from "./OpenGraphTags";
import appendOgImageDimensions from "./appendOgImageDimensions";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

const SocialSettings = ({ Bind, data, setValue }) => {
    return (
        <React.Fragment>
            {/* We need this hidden field because of the `appendOgImageDimensions` callback and because
                of the fact that it sts values into the `settings.social.meta` array. */}
            <Bind name={"settings.social.meta"} />
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.social.title"}>
                        <DelayedOnChange>
                            <Input
                                label="Title (leave blank to use your page title)"
                                description="Social media title (og:title)."
                            />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
            </Grid>
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.social.description"}>
                        <DelayedOnChange>
                            <Input
                                label="Description (leave blank to use your page snippet)"
                                description="Social media description (og:description)."
                            />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
            </Grid>

            <Grid>
                <Cell span={12}>
                    <Bind
                        name={"settings.social.image"}
                        afterChange={value => appendOgImageDimensions({ value, data, setValue })}
                    >
                        <SingleImageUpload
                            onChangePick={["src", "id"]}
                            label="Social Image"
                            description={`Linked via "og:image" tag. Recommended resolution 1596x545.`}
                            // @ts-ignore // TODO: @adrian what's this prop name ?
                            imageEditor={{
                                crop: {
                                    autoEnable: true,
                                    aspectRatio: 1596 / 545
                                }
                            }}
                        />
                    </Bind>
                </Cell>
            </Grid>

            <Bind name={"settings.social.meta"} defaultValue={[]}>
                {props => <OpenGraphTags prefix={"settings.social.meta"} Bind={Bind} {...props} />}
            </Bind>
        </React.Fragment>
    );
};

export default SocialSettings;
