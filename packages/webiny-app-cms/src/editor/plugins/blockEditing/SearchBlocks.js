//@flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withState } from "recompose";
import { deactivatePlugin, updateElement } from "webiny-app-cms/editor/actions";
import { getContent } from "webiny-app-cms/editor/selectors";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { getPlugins } from "webiny-plugins";
import { createElement } from "webiny-app-cms/editor/utils";
import { SecondaryLayout } from "webiny-app-admin/components/Views/SecondaryLayout";
import { ReactComponent as SearchIcon } from "webiny-app-cms/editor/assets/icons/search.svg";
import * as Styled from "./StyledComponents";
import BlockPreview from "./BlockPreview";
import { listItem, ListItemTitle, listStyle, TitleContent } from "./SearchBlocksStyled";

import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-app-admin/components/Views/SimpleForm";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import { Icon } from "webiny-ui/Icon";
import { List, ListItem, ListItemGraphic } from "webiny-ui/List";
import { Typography } from "webiny-ui/Typography";

type SearchBarProps = {
    addKeyHandler: Function,
    createBlockFromType: Function,
    deactivatePlugin: Function,
    removeKeyHandler: Function,
    updateElement: Function,
    content: Object,
    active: string,
    setActive: Function
};

type SearchBarState = {
    search: string,
    activeTab: number
};

class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
    state = {
        search: "",
        activeTab: 0
    };

    componentDidMount() {
        this.props.addKeyHandler("escape", e => {
            e.preventDefault();
            this.props.deactivatePlugin({ name: "cms-search-blocks-bar" });
        });
    }

    componentWillUnmount() {
        this.props.removeKeyHandler("escape");
    }

    addBlockToContent = plugin => {
        const { content } = this.props;
        const element = { ...content, elements: [...content.elements, createElement(plugin.name)] };
        this.props.updateElement({ element });
    };

    getCategoryBlocksCount({ plugins, category }) {
        return this.getBlocksList({
            blocks: plugins.blocks,
            categories: { active: { name: category } }
        }).length;
    }

    /**
     * Renders list of blocks - by selected category and by searched term (if typed).
     * Will render blank state if no plugins are to be shown.
     * @param blocks
     * @param categories
     * @returns {*}
     */
    getBlocksList({ blocks, categories }) {
        const activeCategory = categories.active;
        if (!activeCategory) {
            return [];
        }

        let output = blocks;

        // If "all" is selected, no category filtering is required.
        if (activeCategory.name !== "cms-block-category-all") {
            if (activeCategory.name === "cms-block-category-saved") {
                output = output.filter(item => {
                    return item.tags && item.tags.includes("saved");
                });
            } else {
                output = output.filter(item => {
                    return item.category === activeCategory.name;
                });
            }
        }

        // Finally, filter by typed search term.
        if (this.state.search) {
            output = output.filter(item => {
                return item.title.toLowerCase().includes(this.state.search.toLowerCase());
            });
        }

        return output;
    }

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
        const { active, setActive } = this.props;

        const plugins = {
            categories: {
                list: getPlugins("cms-block-category"),
                active: getPlugins("cms-block-category").find(({ name }) => name === active)
            },
            blocks: getPlugins("cms-block")
        };

        const blocksList = this.getBlocksList(plugins);

        return (
            <SecondaryLayout
                barMiddle={this.renderSearchInput()}
                onExited={() => this.props.deactivatePlugin({ name: "cms-search-blocks-bar" })}
            >
                <CompactView>
                    <LeftPanel span={5}>
                        <List twoLine className={listStyle}>
                            {plugins.categories.list.map(p => (
                                <ListItem
                                    key={p.name}
                                    className={listItem}
                                    onClick={() => {
                                        setActive(p.name);
                                    }}
                                >
                                    <ListItemGraphic>
                                        <Icon icon={p.icon} />
                                    </ListItemGraphic>
                                    <TitleContent>
                                        <ListItemTitle>
                                            {p.title} (
                                            {this.getCategoryBlocksCount({
                                                plugins,
                                                category: p.name
                                            })}
                                            )
                                        </ListItemTitle>
                                        <Typography use={"subtitle2"}>{p.description}</Typography>
                                    </TitleContent>
                                </ListItem>
                            ))}
                        </List>
                    </LeftPanel>
                    <RightPanel span={7}>
                        {plugins.categories.active && (
                            <SimpleForm>
                                <SimpleFormHeader title={plugins.categories.active.title} />
                                <SimpleFormContent>
                                    <Styled.BlockList>
                                        {blocksList.length > 0 ? (
                                            blocksList.map(p => (
                                                <BlockPreview
                                                    key={p.name}
                                                    plugin={p}
                                                    addBlockToContent={this.addBlockToContent}
                                                    deactivatePlugin={this.props.deactivatePlugin}
                                                />
                                            ))
                                        ) : (
                                            <div>Nothing to show :/</div>
                                        )}
                                    </Styled.BlockList>
                                </SimpleFormContent>
                            </SimpleForm>
                        )}
                    </RightPanel>
                </CompactView>
            </SecondaryLayout>
        );
    }
}

export default compose(
    connect(
        state => ({ content: getContent(state) }),
        {
            deactivatePlugin,
            updateElement
        }
    ),
    withKeyHandler(),
    withState("active", "setActive", "cms-block-category-all")
)(SearchBar);
