// @flow
import * as React from "react";
import invariant from "invariant";
import { i18n } from "webiny-app/i18n";
import logoOrange from "./../assets/images/logo_orange.png";

import { authenticate } from "webiny-app/actions";
import { connect } from "react-redux";
import { compose } from "recompose";
import styled from "react-emotion";
import { css } from "emotion";
import _ from "lodash";

import { Form } from "webiny-form";
import { Elevation } from "webiny-ui/Elevation";
import { ButtonPrimary } from "webiny-ui/Button";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";

const t = i18n.namespace("Webiny.Admin.Login");

const Wrapper = styled("section")({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "100vh",
    color: "var(--mdc-theme-on-surface)"
});

const Logo = styled("img")({
    margin: "0 auto",
    marginBottom: 30,
    width: 125
});

const LoginContent = styled("div")({
    maxWidth: 500,
    margin: "0 auto 25px auto",
    ".mdc-elevation--z2": {
        borderRadius: 4,
        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.15)"
    }
});

const InnerContent = styled("div")({
    padding: 25
});

const Footer = styled("div")({
    textAlign: "center",
    marginBottom: 75,
    a: {
        textDecoration: "none",
        color: "var(--mdc-theme-primary)"
    }
});

const Title = styled("div")({
    textAlign: "center",
    margin: "10px 25px"
});

const alignRight = css({
    textAlign: "right"
});

class Login extends React.Component<any, any> {
    constructor(props) {
        super(props);
        invariant(props.identity, `You must specify an "identity" prop!`);
        invariant(props.strategy, `You must specify a "strategy" prop!`);
    }

    UNSAFE_componentWillReceiveProps(props) {
        const authentication = _.get(props, "security.authentication", {});
        if (authentication.user) {
            props.onSuccess(authentication.user);
        }
    }

    render() {
        const { identity, strategy, authenticate } = this.props;
        const authentication = _.get(this.props, "security.authentication", {});

        return (
            <Wrapper>
                <Logo src={logoOrange} />
                <Form onSubmit={model => authenticate({ ...model, identity, strategy })}>
                    {({ form, Bind }) => (
                        <React.Fragment>
                            <LoginContent>
                                <Elevation z={2}>
                                    <InnerContent>
                                        <Title>
                                            <h1>
                                                <Typography use="headline4">{t`Sign In`}</Typography>
                                            </h1>
                                            <p>
                                                <Typography use="subtitle2">{t`to access your Webiny account`}</Typography>
                                            </p>
                                        </Title>

                                        {authentication.error && (
                                            <Grid>
                                                <Cell span={12}>
                                                    {authentication.error.message}
                                                </Cell>
                                            </Grid>
                                        )}

                                        <Grid>
                                            <Cell span={12}>
                                                <Bind
                                                    name="username"
                                                    validators={["required", "email"]}
                                                >
                                                    <Input label={t`Your e-mail`} box={true} />
                                                </Bind>
                                            </Cell>
                                        </Grid>

                                        <Grid>
                                            <Cell span={12}>
                                                <Bind
                                                    name="password"
                                                    validators={["required", "password"]}
                                                >
                                                    <Input
                                                        type={"password"}
                                                        label={t`Your password`}
                                                        box={true}
                                                    />
                                                </Bind>
                                            </Cell>
                                        </Grid>

                                        <Grid>
                                            <Cell span={12} className={alignRight}>
                                                <ButtonPrimary raised onClick={form.submit}>
                                                    {t`Submit`}
                                                </ButtonPrimary>
                                            </Cell>
                                        </Grid>
                                    </InnerContent>
                                </Elevation>
                            </LoginContent>
                            <Footer>
                                <p>
                                    <Typography use="overline">{t`powered by`}</Typography>
                                </p>
                                <a href="https://www.webiny.com/">
                                    <Typography use="body2">www.webiny.com</Typography>
                                </a>
                            </Footer>
                        </React.Fragment>
                    )}
                </Form>
            </Wrapper>
        );
    }
}

export default compose(
    connect(
        state => ({
            security: state.security
        }),
        { authenticate }
    )
)(Login);
