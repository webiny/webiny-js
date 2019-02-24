import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { compose, withProps, withHandlers } from "recompose";
import { ButtonPrimary, IconButton } from "webiny-ui/Button";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";
import { Switch } from "webiny-ui/Switch";
import { Cell, Grid } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";
import { ReactComponent as RemoveIcon } from "webiny-app-cms/editor/assets/icons/close.svg";

const InputContainer = styled("div")({
    width: "100%",
    "> .mdc-text-field.mdc-text-field--upgraded": {
        height: "30px !important",
        width: "100%",
        ".mdc-text-field__input": {
            paddingTop: 5,
            paddingRight: 30,
            fontSize: "0.8em"
        }
    }
});

const removeButton = css({
    position: "absolute !important",
    top: 5,
    right: 5
});

const LinkMenu = ({ linkData, updateLink, closeMenu, removeLink }) => {
    return (
        <Form data={linkData} onSubmit={updateLink}>
            {({ Bind, submit }) => (
                <React.Fragment>
                    <Grid>
                        <Cell span={3}>
                            <Typography use={"overline"}>URL</Typography>
                        </Cell>
                        <Cell span={9}>
                            <InputContainer>
                                <Bind name={"href"} validators={["required"]}>
                                    <Input
                                        placeholder={"Enter URL"}
                                        onKeyPress={e => {
                                            if (e.key === "Enter") {
                                                submit();
                                                closeMenu();
                                            }
                                        }}
                                    />
                                </Bind>
                                {linkData.href && (
                                    <IconButton
                                        className={removeButton}
                                        icon={<RemoveIcon />}
                                        onClick={() => {
                                            removeLink();
                                            closeMenu();
                                        }}
                                    />
                                )}
                            </InputContainer>
                        </Cell>
                    </Grid>
                    <Grid>
                        <Cell span={3} style={{ marginBottom: 0 }}>
                            <Typography use={"overline"}>NEW TAB</Typography>
                        </Cell>
                        <Cell span={3} style={{ justifySelf: "flex-start", marginBottom: 0 }}>
                            <Bind name={"newTab"}>
                                <Switch onChange={() => submit()} />
                            </Bind>
                        </Cell>
                        <Cell span={3} style={{ marginBottom: 0 }}>
                            <Typography use={"overline"}>NO FOLLOW</Typography>
                        </Cell>
                        <Cell span={3} style={{ justifySelf: "flex-start", marginBottom: 0 }}>
                            <Bind name={"noFollow"}>
                                <Switch onChange={() => submit()} />
                            </Bind>
                        </Cell>
                    </Grid>
                    <Grid>
                        <Cell span={12} style={{ marginBottom: 0, float: "right" }}>
                            <ButtonPrimary
                                onClick={() => {
                                    submit();
                                    closeMenu();
                                }}
                            >
                                Apply
                            </ButtonPrimary>
                        </Cell>
                    </Grid>
                </React.Fragment>
            )}
        </Form>
    );
};

const TYPE = "link";
const isLink = i => i.type === TYPE;
const createLinkRange = (change, selection) => {
    change.select(selection);
    let link = change.value.inlines.find(isLink);
    if (!link) {
        return selection;
    }
    // Create full link range
    const firstText = link.getFirstText();
    const lastText = link.getLastText();
    return {
        anchor: {
            path: change.value.document.getPath(firstText.key),
            offset: 0
        },
        focus: {
            path: change.value.document.getPath(lastText.key),
            offset: lastText.text.length
        }
    };
};

export default compose(
    withProps(({ value }) => {
        let link = value.inlines.some(isLink) && value.inlines.find(isLink);
        return { linkData: (link && link.data) || {} };
    }),
    withHandlers({
        updateLink: ({ editor, onChange, value: { selection } }) => data => {
            editor.change(change => {
                change
                    .select(createLinkRange(change, selection))
                    .unwrapInline(TYPE)
                    .wrapInline({ type: TYPE, data })
                    .moveToEnd();

                onChange(change);
            });
        },
        removeLink: ({ editor, onChange, value: { selection } }) => () => {
            editor.change(change => {
                // Restore selection
                change.select(createLinkRange(change, selection)).unwrapInline(TYPE);
                onChange(change);
            });
        }
    })
)(LinkMenu);
