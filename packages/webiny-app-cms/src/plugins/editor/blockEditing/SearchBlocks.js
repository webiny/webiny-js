//@flow
import React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { ButtonFloating } from "webiny-ui/Button";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Icon } from "webiny-ui/Icon";
import { deactivatePlugin } from "webiny-app-cms/editor/actions";
import { createBlockFromType } from "./actions";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { getPlugins } from "webiny-app/plugins";
import { updateChildPaths } from "webiny-app-cms/editor/utils";
import Element from "webiny-app-cms/editor/components/Element";
import { RenderContextProvider } from "webiny-app-cms/editor/context";
import { SecondaryLayout } from "webiny-app-admin/components/Views/SecondaryLayout";
import { Elevation } from "webiny-ui/Elevation";

import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add.svg";
import { ReactComponent as SearchIcon } from "webiny-app-cms/editor/assets/icons/search.svg";
import * as Styled from "./StyledComponents";

class SearchBar extends React.Component {
    state = {
        search: "",
        activeTab: 0
    };

    componentDidMount() {
        this.props.addKeyHandler("escape", e => {
            e.preventDefault();
            this.props.deactivatePlugin({ name: "search-blocks-bar" });
        });
    }

    componentWillUnmount() {
        this.props.removeKeyHandler("escape");
    }

    shouldComponentUpdate(props, state) {
        return state.search !== this.state.search || state.activeTab !== this.state.activeTab;
    }

    renderPreview = plugin => {
        // Filter based on search query and block keywords
        let match = false;
        if (this.state.search === "") {
            match = true;
        } else {
            plugin.keywords.forEach(kwd => {
                if (kwd === "*" || kwd.toLowerCase().startsWith(this.state.search.toLowerCase())) {
                    match = true;
                }
            });
        }

        if (!match) {
            return null;
        }

        const block = plugin.create();
        block.path = "-1";
        updateChildPaths(block);

        return (
            <Elevation z={1} key={plugin.name}>
                <Styled.Block>
                    <Styled.Overlay>
                        <Styled.Backdrop className={"backdrop"} />
                        <Styled.AddBlock className={"add-block"}>
                            <ButtonFloating
                                label={"Click to Add"}
                                onClick={e => {
                                    this.props.createBlockFromType({ type: plugin.name });
                                    !e.shiftKey &&
                                        this.props.deactivatePlugin({ name: "search-blocks-bar" });
                                }}
                                icon={<AddIcon />}
                            />
                        </Styled.AddBlock>
                    </Styled.Overlay>
                    <Styled.BlockPreview>
                        <BlockPreviewComponent>
                            <RenderContextProvider value={{ preview: true }}>
                                <Element element={block} />
                            </RenderContextProvider>
                        </BlockPreviewComponent>
                    </Styled.BlockPreview>
                </Styled.Block>
            </Elevation>
        );
    };

    renderSearchInput = () => {
        return (
            <Styled.Input>
                <Icon className={Styled.searchIcon} icon={<SearchIcon />} />
                <input
                    autoFocus
                    type={"text"}
                    placeholder="Search blocks..."
                    value={this.state.search}
                    onChange={e => this.setState({ search: e.target.value })}
                />
            </Styled.Input>
        );
    };

    render() {
        const plugins = getPlugins("block");

        return (
            <SecondaryLayout
                barMiddle={this.renderSearchInput()}
                onExited={() => this.props.deactivatePlugin({ name: "search-blocks-bar" })}
            >
                <Elevation className={Styled.wrapper} z={1}>
                    <Tabs>
                        <Tab label={"All"}>
                            <Styled.BlockList>{plugins.map(this.renderPreview)}</Styled.BlockList>
                        </Tab>
                        <Tab label={"Saved"} />
                        <Tab label={"Global"} />
                    </Tabs>
                </Elevation>
            </SecondaryLayout>
        );
    }
}

class BlockPreviewComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            style: ""
        };
    }

    componentDidMount() {
        const height = this.divElement.clientHeight;
        const width = this.divElement.clientWidth;

        let scale = Math.min(310 / width, 160 / height);

        if (scale > 1) {
            scale = 1;
        }

        const style = {
            transform: "scale(" + scale + ")",
            width: "100%"
        };

        this.setState({ style: style });
    }

    render() {
        return (
            <div style={{ ...this.state.style }} ref={divElement => (this.divElement = divElement)}>
                {this.props.children}
            </div>
        );
    }
}

export default compose(
    connect(
        null,
        {
            deactivatePlugin,
            createBlockFromType
        }
    ),
    withKeyHandler()
)(SearchBar);
