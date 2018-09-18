import React from "react";
import { get, set } from "dot-prop-immutable";
import { connect } from "react-redux";
import { compose } from "recompose";
import styled from "react-emotion";
import { updateElement, deactivatePlugin } from "webiny-app-cms/editor/actions";
import { withActiveElement, withTheme } from "webiny-app-cms/editor/components";
import { getPlugins } from "webiny-app/plugins";
import { Input } from "webiny-ui/Input";
import { Form } from "webiny-form";
import { IconButton } from "webiny-ui/Button";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as CloseIcon } from "webiny-app-cms/editor/assets/icons/close.svg";

const Header = styled("div")(() => ({
    backgroundColor: "#b6b6b636",
    color: "var(--mdc-theme-on-surface)",
    padding: "20px 30px",
    fontSize: 18,
    height: 24,
    boxShadow: "0 3px 1px -2px rgba(0,0,0,.2)"
}));

const Body = styled("div")({
    padding: 20,
    height: "calc(100vh - 82px)",
    overflow: "scroll"
});

const CloseButton = styled("div")({
    position: "absolute",
    right: 6,
    top: 6
});

class Advanced extends React.Component {
    render() {
        const { element, updateElement, deactivatePlugin, theme } = this.props;

        const plugin = getPlugins("cms-element").find(pl => pl.name === element.type);

        return (
            <React.Fragment>
                <Header>
                    Advanced settings{" "}
                    <CloseButton>
                        <IconButton
                            onClick={() => {
                                updateElement({ element });
                                deactivatePlugin({ name: "cms-element-settings-advanced" });
                            }}
                            icon={<CloseIcon />}
                        />
                    </CloseButton>
                </Header>
                <Body>
                    <Form
                        data={get(element, "settings.advanced", {})}
                        onChange={data =>
                            updateElement({
                                element: set(element, "settings.advanced", data),
                                history: false
                            })
                        }
                    >
                        {({ Bind }) => (
                            <React.Fragment>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name={"style.classNames"}>
                                            <Input
                                                label={"CSS class"}
                                                description={"Custom CSS class names"}
                                            />
                                        </Bind>
                                    </Cell>
                                </Grid>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name={"style.inline"}>
                                            <Input
                                                rows={10}
                                                label={"Inline CSS"}
                                                description={"Edit inline CSS styles"}
                                            />
                                        </Bind>
                                    </Cell>
                                </Grid>
                                {plugin &&
                                    typeof plugin.renderSidebar === "function" &&
                                    plugin.renderSidebar({ Bind, theme })}
                            </React.Fragment>
                        )}
                    </Form>
                </Body>
            </React.Fragment>
        );
    }
}

export default compose(
    connect(
        null,
        { updateElement, deactivatePlugin }
    ),
    withActiveElement(),
    withTheme()
)(Advanced);
