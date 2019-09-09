//@flow
import React, { useEffect, useCallback, useState, useMemo } from "react";
import { Mutation } from "react-apollo";
import { clone } from "lodash";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { deactivatePlugin, updateElement } from "@webiny/app-page-builder/editor/actions";
import { getContent } from "@webiny/app-page-builder/editor/selectors";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { getPlugins, unregisterPlugin } from "@webiny/plugins";
import { createBlockElements } from "@webiny/app-page-builder/editor/utils";
import { OverlayLayout } from "@webiny/app-admin/components/OverlayLayout";
import { ReactComponent as SearchIcon } from "@webiny/app-page-builder/editor/assets/icons/search.svg";
import * as Styled from "./StyledComponents";
import { listItem, ListItemTitle, listStyle, TitleContent } from "./SearchBlocksStyled";
import EditBlockDialog from "./EditBlockDialog";
import { DELETE_ELEMENT, UPDATE_ELEMENT } from "./graphql";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { Icon } from "@webiny/ui/Icon";
import { List, ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as AllIcon } from "./icons/round-clear_all-24px.svg";
import createBlockPlugin from "@webiny/app-page-builder/admin/utils/createBlockPlugin";
import BlocksList from "./BlocksList";

const allBlockCategory = {
    type: "pb-editor-block-category",
    name: "pb-editor-block-category-all",
    categoryName: "all",
    title: "All blocks",
    description: "List of all available blocks.",
    icon: <AllIcon />
};

const SearchBar = props => {
    const { updateElement, content, deactivatePlugin } = props;

    const [search, setSearch] = useState("");
    const [editingBlock, setEditingBlock] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all");

    const allCategories = useMemo(
        () => [allBlockCategory, ...getPlugins("pb-editor-block-category")],
        []
    );

    const allBlocks = useMemo(() => getPlugins("pb-editor-block"), []);

    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            deactivatePlugin({ name: "pb-editor-search-blocks-bar" });
        });

        return () => removeKeyHandler("escape");
    }, []);

    const addBlockToContent = useCallback(
        plugin => {
            const element = {
                ...content,
                elements: [...content.elements, createBlockElements(plugin.name)]
            };
            updateElement({ element });
        },
        [content]
    );

    /**
     * Returns a list of blocks - by selected category and by searched term (if present).
     * @returns {*}
     */
    const getBlocksList = () => {
        if (!activeCategory) {
            return [];
        }

        let output = allBlocks;

        // If "all" is selected, no category filtering is required.
        if (activeCategory !== "all") {
            if (activeCategory === "saved") {
                output = output.filter(item => {
                    return item.tags && item.tags.includes("saved");
                });
            } else {
                output = output.filter(item => {
                    return item.category === activeCategory;
                });
            }
        }

        // Finally, filter by typed search term.
        if (search) {
            output = output.filter(item => {
                return item.title.toLowerCase().includes(search.toLowerCase());
            });
        }

        return output.sort(function(a, b) {
            if (a.title < b.title) {
                return -1;
            }
            if (a.title > b.title) {
                return 1;
            }
            return 0;
        });
    };

    const getCategoryBlocksCount = useCallback(category => {
        if (category === "all") {
            return allBlocks.length;
        }
        return allBlocks.filter(pl => pl.category === category).length;
    }, []);

    const { showSnackbar } = useSnackbar();

    const deleteBlock = useCallback(async ({ plugin, deleteElement }) => {
        const response = await deleteElement({
            variables: {
                id: plugin.id
            }
        });

        const { error } = response.data.pageBuilder.deleteElement;
        if (error) {
            showSnackbar(error.message);
            return;
        }

        unregisterPlugin(plugin.name);
        showSnackbar("Block " + plugin.title + " successfully deleted.");
    }, []);

    const updateBlock = useCallback(
        async ({ updateElement, data: { title: name, category } }) => {
            if (!editingBlock) {
                return;
            }

            const response = await updateElement({
                variables: {
                    id: editingBlock.id,
                    data: { name, category }
                }
            });

            const { error, data } = response.data.pageBuilder.updateElement;
            if (error) {
                showSnackbar(error.message);
                return;
            }

            // This will replace previously registered block plugin.
            createBlockPlugin(data);

            setEditingBlock(null);
            setTimeout(() => {
                // For better UX, success message is shown after 300ms has passed.
                showSnackbar("Block " + editingBlock.title + " successfully saved.");
            }, 300);
        },
        [editingBlock]
    );

    const renderSearchInput = useCallback(() => {
        return (
            <Styled.Input>
                <Icon className={Styled.searchIcon} icon={<SearchIcon />} />
                <input
                    autoFocus
                    type={"text"}
                    placeholder="Search blocks..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </Styled.Input>
        );
    }, [search]);

    const onExited = useCallback(() => {
        deactivatePlugin({ name: "pb-editor-search-blocks-bar" });
    }, []);

    const categoryPlugin = allCategories.find(pl => pl.categoryName === activeCategory);

    return (
        <OverlayLayout barMiddle={renderSearchInput()} onExited={onExited}>
            <SplitView>
                <LeftPanel span={3}>
                    <List twoLine className={listStyle}>
                        {allCategories.map(p => (
                            <ListItem
                                key={p.name}
                                className={listItem}
                                onClick={() => {
                                    setActiveCategory(p.categoryName);
                                }}
                            >
                                <ListItemGraphic>
                                    <Icon icon={p.icon} />
                                </ListItemGraphic>
                                <TitleContent>
                                    <ListItemTitle>
                                        {p.title} ({getCategoryBlocksCount(p.categoryName)})
                                    </ListItemTitle>
                                    <Typography use={"subtitle2"}>{p.description}</Typography>
                                </TitleContent>
                            </ListItem>
                        ))}
                    </List>
                </LeftPanel>
                <RightPanel span={9}>
                    <Mutation mutation={UPDATE_ELEMENT}>
                        {updateElement => (
                            <Mutation mutation={DELETE_ELEMENT}>
                                {deleteElement =>
                                    activeCategory && (
                                        <SimpleForm>
                                            <SimpleFormHeader
                                                title={categoryPlugin.title}
                                                icon={categoryPlugin.icon}
                                            />
                                            <SimpleFormContent>
                                                <Styled.BlockList>
                                                    <BlocksList
                                                        key={activeCategory}
                                                        category={activeCategory}
                                                        addBlock={addBlockToContent}
                                                        deactivatePlugin={deactivatePlugin}
                                                        blocks={clone(getBlocksList())}
                                                        onEdit={plugin => setEditingBlock(plugin)}
                                                        onDelete={plugin =>
                                                            deleteBlock({
                                                                plugin,
                                                                deleteElement
                                                            })
                                                        }
                                                    />
                                                </Styled.BlockList>

                                                <EditBlockDialog
                                                    onClose={() => setEditingBlock(null)}
                                                    onSubmit={data =>
                                                        updateBlock({ data, updateElement })
                                                    }
                                                    open={!!editingBlock}
                                                    plugin={editingBlock}
                                                />
                                            </SimpleFormContent>
                                        </SimpleForm>
                                    )
                                }
                            </Mutation>
                        )}
                    </Mutation>
                </RightPanel>
            </SplitView>
        </OverlayLayout>
    );
};

export default connect(
    state => ({ content: getContent(state) }),
    {
        deactivatePlugin,
        updateElement
    }
)(SearchBar);
