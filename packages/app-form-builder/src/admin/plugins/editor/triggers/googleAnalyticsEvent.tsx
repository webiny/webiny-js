import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as InsightsIcon } from "@material-symbols/svg-400/outlined/insights.svg";
import GoogleAnalyticsEventDynamicFieldset from "./components/GoogleAnalyticsEventDynamicFieldset";
import { FbEditorTrigger } from "~/types";

const t = i18n.namespace("FormsApp.Editor.GoogleAnalyticsEventTriggerSettings");

const plugin: FbEditorTrigger = {
    type: "form-editor-trigger",
    name: "form-editor-trigger-google-analytics-event",
    trigger: {
        id: "google-analytics-event",
        title: "Google Analytics Event",
        description:
            "Trigger a Google Analytics Event. (Note: It requires you to have Google Analytics installed on your site.)",
        icon: <InsightsIcon />,
        renderSettings({ Bind, submit }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"eventName"}>
                            <Input
                                label={t`Event name`}
                                description={t`Name of the Google Analytics Event`}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind name={"eventParams"}>
                            <GoogleAnalyticsEventDynamicFieldset
                                Bind={Bind}
                                title={"Event parameters"}
                                addButtonLabel={"+ Add parameter"}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <ButtonPrimary
                            onClick={ev => {
                                submit(ev);
                            }}
                        >
                            {t`Save`}
                        </ButtonPrimary>
                    </Cell>
                    <Cell span={12}>
                        <Typography use="body1">
                            Note: Make sure you have Google Analytics installed on your website
                            before using this trigger.
                        </Typography>
                    </Cell>
                </Grid>
            );
        }
    }
};
export default plugin;
