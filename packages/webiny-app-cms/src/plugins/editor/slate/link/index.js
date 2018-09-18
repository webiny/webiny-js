import React from "react";
import styled from "react-emotion";
import { css } from "emotion";
import { ButtonPrimary, IconButton } from "webiny-ui/Button";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";
import { Switch } from "webiny-ui/Switch";
import { Cell, Grid } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";
import { ReactComponent as LinkIcon } from "webiny-app-cms/editor/assets/icons/link.svg";
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

function hasLinks(value) {
    return value.inlines.some(inline => inline.type === "link");
}

function updateLink(data, editor, selection) {
    const { value, onChange } = editor;
    const change = value.change().select(selection);

    change
        .unwrapInline("link")
        .wrapInline({ type: "link", data })
        .moveToEnd();

    onChange(change);
}

function removeLink(link, editor) {
    const { value, onChange } = editor;
    const change = value.change().moveToRangeOfNode(link);
    change.unwrapInline("link");
    onChange(change);
}

export default () => {
    return {
        menu: [
            {
                name: "link-menu-item",
                type: "cms-slate-menu-item",
                render(props: Object) {
                    const { MenuButton } = props;

                    return (
                        <MenuButton onMouseDown={() => props.activatePlugin(this.name)}>
                            <LinkIcon />
                        </MenuButton>
                    );
                },
                renderMenu(props) {
                    const { editor, closeMenu, selection } = props;
                    // Restore selection
                    const value = editor.value.change().select(selection).value;
                    // Find a link inside current selection
                    let link =
                        hasLinks(value) && value.inlines.find(inline => inline.type === "link");

                    return (
                        <Form
                            data={(link && link.get("data").toJSON()) || {}}
                            onSubmit={data => {
                                updateLink(data, editor, selection);
                            }}
                        >
                            {({ Bind, submit }) => (
                                <React.Fragment>
                                    <Grid>
                                        <Cell span={3}>
                                            <Typography use={"overline"}>URL</Typography>
                                        </Cell>
                                        <Cell span={9}>
                                            <InputContainer>
                                                <Bind
                                                    name={"href"}
                                                    validators={["required", "url"]}
                                                >
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
                                                {link && (
                                                    <IconButton
                                                        className={removeButton}
                                                        icon={<RemoveIcon />}
                                                        onClick={() => {
                                                            removeLink(link, editor);
                                                            closeMenu();
                                                        }}
                                                    />
                                                )}
                                            </InputContainer>
                                        </Cell>
                                        <Cell span={3} style={{ marginBottom: 0 }}>
                                            <Typography use={"overline"}>NEW TAB</Typography>
                                        </Cell>
                                        <Cell
                                            span={2}
                                            style={{ justifySelf: "flex-start", marginBottom: 0 }}
                                        >
                                            <Bind name={"newTab"}>
                                                <Switch
                                                    onChange={() => {
                                                        submit();
                                                    }}
                                                />
                                            </Bind>
                                        </Cell>
                                        <Cell span={7} style={{ marginBottom: 0 }}>
                                            <ButtonPrimary
                                                onClick={() => {
                                                    submit();
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
                }
            }
        ],
        editor: [
            {
                name: "link",
                type: "cms-slate-editor",
                slate: {
                    renderNode(props) {
                        const { attributes, children, node } = props;

                        if (node.type === "link") {
                            const { data } = node;
                            const href = data.get("href");
                            return (
                                <a {...attributes} href={href}>
                                    {children}
                                </a>
                            );
                        }
                    }
                }
            }
        ]
    };
};
