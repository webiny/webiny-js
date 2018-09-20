//@flow
import React from "react";
import { connect } from "react-redux";
import compose from "recompose/compose";
import lifecycle from "recompose/lifecycle";
import { Accordion, AccordionItem } from "webiny-ui/Accordion";
import { deactivatePlugin } from "webiny-app-cms/editor/actions";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { SecondaryLayout } from "webiny-app-admin/components/Views/SecondaryLayout";
import styled from "react-emotion";
import { Typography } from "webiny-ui/Typography";

import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";

const Wrapper = styled("div")({
    width: 800,
    margin: "50px auto 0 auto"
});

const Title = (
    <Typography
        style={{ margin: "0 auto", color: "var(--mdc-theme-on-surface)" }}
        use={"headline6"}
    >
        Page Settings
    </Typography>
);

const PageSettings = ({ deactivatePlugin }) => {
    return (
        <SecondaryLayout
            barMiddle={Title}
            onExited={() => deactivatePlugin({ name: "cms-page-settings-bar" })}
        >
            <Wrapper>
                <Accordion>
                    <AccordionItem
                        icon={<SettingsIcon />}
                        title="Settings 1"
                        description="Settings description"
                    >
                        <div>Inner child 1</div>
                    </AccordionItem>
                    <AccordionItem
                        icon={<SettingsIcon />}
                        title="Settings 2"
                        description="Settings description"
                    >
                        <div>Inner child 2</div>
                    </AccordionItem>
                </Accordion>
            </Wrapper>
        </SecondaryLayout>
    );
};

export default compose(
    connect(
        null,
        { deactivatePlugin }
    ),
    withKeyHandler(),
    lifecycle({
        componentDidMount() {
            this.props.addKeyHandler("escape", e => {
                e.preventDefault();
                this.props.deactivatePlugin({ name: "cms-page-settings-bar" });
            });
        },
        componentWillUnmount() {
            this.props.removeKeyHandler("escape");
        }
    })
)(PageSettings);
