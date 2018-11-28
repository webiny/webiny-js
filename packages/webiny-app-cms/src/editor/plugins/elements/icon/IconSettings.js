//@flow
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { connect } from "react-redux";
import { compose } from "recompose";
import { isEqual } from "lodash";
import { getPlugins } from "webiny-plugins";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import IconPicker from "webiny-app-cms/editor/components/IconPicker";
import { get, set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import ColorPicker from "webiny-app-cms/editor/components/ColorPicker";
import { updateElement } from "webiny-app-cms/editor/actions";
import { InputContainer } from "../../elementSettings/utils/StyledComponents";

type Props = {
    element: Object,
    updateElement: Function
};

let icons;
const getIcons = () => {
    if (!icons) {
        icons = getPlugins("cms-icons").reduce((icons: Array<Object>, pl: Object) => {
            return icons.concat(pl.getIcons());
        }, []);
    }
    return icons;
};

const getSvg = (id: Array<string>, props: Object) => {
    if (!props.width) {
        props.width = 50;
    }
    const svg = getIcons().find(ic => isEqual(ic.id, id)).svg;
    return renderToStaticMarkup(React.cloneElement(svg, props));
};

class IconSettings extends React.Component<Props> {
    historyUpdated = {};

    updateSettings = (name, value, history = true) => {
        const { element, updateElement } = this.props;
        const attrKey = `settings.advanced.icon.${name}`;

        let newElement = set(element, attrKey, value);

        const { id, width, color } = get(newElement, "settings.advanced.icon");
        newElement = set(newElement, "data.icon", getSvg(id, { width, color }));

        if (!history) {
            updateElement({ element: newElement, history });
            return;
        }

        if (this.historyUpdated[name] !== value) {
            this.historyUpdated[name] = value;
            updateElement({ element: newElement });
        }
    };

    render() {
        const { element } = this.props;
        const { settings: { advanced: { icon = {} } = {} } = {} } = element;

        return (
            <React.Fragment>
                <Tabs>
                    <Tab label={"Icon"}>
                        <Grid>
                            <Cell span={4}>
                                <Typography use={"overline"}>Icon</Typography>
                            </Cell>
                            <Cell span={8}>
                                <IconPicker
                                    label={"Icon"}
                                    value={icon.id}
                                    onChange={({ id }) => this.updateSettings("id", id)}
                                />
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={4}>
                                <Typography use={"overline"}>Width</Typography>
                            </Cell>
                            <Cell span={8}>
                                <InputContainer>
                                    <Input
                                        value={icon.width || 50}
                                        onChange={width => this.updateSettings("width", width)}
                                    />
                                </InputContainer>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={4}>
                                <Typography use={"overline"}>Color</Typography>
                            </Cell>
                            <Cell span={8}>
                                <ColorPicker
                                    compact
                                    value={icon.color}
                                    onChange={value => this.updateSettings("color", value, false)}
                                    onChangeComplete={value => this.updateSettings("color", value)}
                                />
                            </Cell>
                        </Grid>
                    </Tab>
                </Tabs>
            </React.Fragment>
        );
    }
}

export default compose(
    connect(
        null,
        { updateElement }
    ),
    withActiveElement()
)(IconSettings);
