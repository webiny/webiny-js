import React from "react";
import { Component } from "webiny-client";

@Component({ modules: ["Input", "Grid", "Section"] })
class WidgetStyle extends React.Component {
    render() {
        const {
            Bind,
            modules: { Input, Grid, Section }
        } = this.props;
        return (
            <React.Fragment>
                <Section title={"Content"}/>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <Bind name={"style.content.className"}>
                            <Input label={"CSS class"} />
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Col all={6}>
                        <Bind name={"style.content.width"}>
                            <Input label={"Width"} />
                        </Bind>
                    </Grid.Col>
                    <Grid.Col all={6}>
                        <Bind name={"style.content.padding"}>
                            <Input label={"Padding"} />
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <Bind name={"style.content.backgroundColor"}>
                            <Input label={"Background"} type={"color"} />
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Section title={"Widget"}/>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <Bind name={"style.widget.className"}>
                            <Input label={"CSS class"} />
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Col all={6}>
                        <Bind name={"style.widget.margin"}>
                            <Input label={"Margin"} />
                        </Bind>
                    </Grid.Col>
                    <Grid.Col all={6}>
                        <Bind name={"style.widget.padding"}>
                            <Input label={"Padding"} />
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <Bind name={"style.widget.backgroundColor"}>
                            <Input label={"Background"} type={"color"} />
                        </Bind>
                    </Grid.Col>
                </Grid.Row>
            </React.Fragment>
        );
    }
}

export default WidgetStyle;