import * as React from "react";
import { Alert, Button, Grid, Input, Label, Link, OverlayLoader, Text } from "@webiny/admin-ui";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { useAuthenticator } from "@webiny/app-cognito-authenticator/hooks/useAuthenticator.js";
import { useForgotPassword } from "@webiny/app-cognito-authenticator/hooks/useForgotPassword.js";
import { View } from "~/components/View.js";

export const ForgotPassword = () => {
    const { authData, changeState } = useAuthenticator();
    const { loading, codeSent, shouldRender, setPassword, requestCode, error } =
        useForgotPassword();

    if (!shouldRender) {
        return null;
    }

    const { username = "" } = authData || {};

    return (
        <View.Container>
            <Form
                data={{ username }}
                onSubmit={({ username }) =>
                    codeSent ? setPassword({ username }) : requestCode({ username })
                }
                submitOnEnter
            >
                {({ Bind, submit, data }) => (
                    <View.Content>
                        {loading && <OverlayLoader />}
                        <View.Title
                            title={"Password recovery"}
                            description={"Request a password reset code."}
                        />
                        {error && (
                            <div className={"mb-lg"}>
                                <Alert title={"Something went wrong"} type={"danger"}>
                                    {error}
                                </Alert>
                            </div>
                        )}

                        {!codeSent ? (
                            <>
                                <Grid>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name="username"
                                            validators={validation.create("required")}
                                            beforeChange={(
                                                val: string,
                                                cb: (value: string) => void
                                            ) => cb(val.toLowerCase())}
                                        >
                                            <Input
                                                label={
                                                    <Label
                                                        text={"Email"}
                                                        hint={
                                                            "A reset code will be sent to your email."
                                                        }
                                                    />
                                                }
                                                size={"lg"}
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <div
                                            className={
                                                "flex flex-row-reverse items-center justify-between"
                                            }
                                        >
                                            <Button
                                                text={"Send me the code"}
                                                onClick={ev => {
                                                    submit(ev);
                                                }}
                                                data-testid="send-code"
                                                size="lg"
                                            />
                                            <Text as={"div"} size={"sm"}>
                                                Want to sign in?&nbsp;
                                                <Link
                                                    to={"#"}
                                                    onClick={() => changeState("signIn")}
                                                >
                                                    Sign in
                                                </Link>
                                                .
                                            </Text>
                                        </div>
                                    </Grid.Column>
                                </Grid>
                            </>
                        ) : (
                            <>
                                <Grid>
                                    <Grid.Column span={12}>
                                        <Text>
                                            We have sent you a code to reset your password!
                                            <br />
                                            <br />
                                            Click the &quot;Resend code&quot; button below to resend
                                            the code in case you haven&apos;t received it the first
                                            time.
                                        </Text>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <div
                                            className={
                                                "flex flex-row-reverse justify-start gap-md"
                                            }
                                        >
                                            <Button
                                                text={"I got the code!"}
                                                onClick={ev => {
                                                    submit(ev);
                                                }}
                                                size="lg"
                                            />
                                            <Button
                                                variant={"secondary"}
                                                text={"Resend code"}
                                                onClick={() => {
                                                    requestCode({ username: data.username });
                                                }}
                                                size="lg"
                                            />
                                        </div>
                                    </Grid.Column>
                                </Grid>
                            </>
                        )}
                    </View.Content>
                )}
            </Form>
        </View.Container>
    );
};
