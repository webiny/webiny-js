// @flow
import React, { useState } from "react";
import { useMutation } from "react-apollo";
import { Form } from "@webiny/form";
import { i18n } from "@webiny/app/i18n";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { EmptyLayout } from "@webiny/app-admin/components/EmptyLayout";
import { Elevation } from "@webiny/ui/Elevation";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import {
    Footer,
    alignRight,
    InnerContent,
    LoginContent,
    Logo,
    Title,
    Wrapper,
    errorMessage
} from "./Login/StyledComponents";
import logoOrange from "./../assets/images/logo_orange.png";
import { loginMutation } from "./Login/graphql";

const t = i18n.ns("app-security/admin/login");

const Login = props => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(null);
    const [doLogin] = useMutation(loginMutation);

    const login = useHandler(props, ({ onToken }) => async formData => {
        setLoading(true);
        // Reset error
        setError(null);
        // Perform login
        const res = await doLogin({ variables: formData });
        const { data, error } = res.data.security.loginUser;
        setLoading(false);
        if (error) {
            return setError(error);
        }

        // Pass the token to Security
        onToken(data.token);
    });

    return (
        <EmptyLayout>
            <Wrapper>
                <Logo src={logoOrange} />
                <Form onSubmit={login} submitOnEnter>
                    {({ form, Bind }) => (
                        <React.Fragment>
                            <LoginContent>
                                <Elevation z={2}>
                                    <InnerContent>
                                        {loading && <CircularProgress />}
                                        <Title>
                                            <h1>
                                                <Typography use="headline4">{t`Sign In`}</Typography>
                                            </h1>
                                            <p>
                                                <Typography use="subtitle2">{t`to access your Webiny account`}</Typography>
                                            </p>
                                        </Title>

                                        {error && (
                                            <Cell span={12} className={errorMessage}>
                                                {error.message}
                                            </Cell>
                                        )}

                                        <Grid>
                                            <Cell span={12}>
                                                <Bind
                                                    name="username"
                                                    validators={validation.create("required,email")}
                                                >
                                                    <Input label={t`Your e-mail`} box="true" />
                                                </Bind>
                                            </Cell>
                                        </Grid>

                                        <Grid>
                                            <Cell span={12}>
                                                <Bind
                                                    name="password"
                                                    validators={validation.create(
                                                        "required,password"
                                                    )}
                                                >
                                                    <Input
                                                        type={"password"}
                                                        label={t`Your password`}
                                                        box="true"
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
        </EmptyLayout>
    );
};

export default Login;
