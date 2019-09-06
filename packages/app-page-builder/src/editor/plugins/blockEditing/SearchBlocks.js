//@flow
import React, { useEffect, useCallback, useState } from "react";
import { Mutation } from "react-apollo";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { deactivatePlugin, updateElement } from "@webiny/app-page-builder/editor/actions";
import { getContent } from "@webiny/app-page-builder/editor/selectors";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { useSnackbar } from "@webiny/app-admin/components/withSnackbar";
import { getPlugins, unregisterPlugin } from "@webiny/plugins";
import { createBlockElements } from "@webiny/app-page-builder/editor/utils";
import { OverlayLayout } from "@webiny/app-admin/components/OverlayLayout";
import { ReactComponent as SearchIcon } from "@webiny/app-page-builder/editor/assets/icons/search.svg";
import * as Styled from "./StyledComponents";
import { listItem, ListItemTitle, listStyle, TitleContent } from "./SearchBlocksStyled";
import EditBlockDialog from "./EditBlockDialog";
import { deleteElement as deleteElementGql, updateElement as updateElementGql } from "./graphql";
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

const SearchBar = ({ updateElement, content, deactivatePlugin }) => {
    const [search, setSearch] = useState("");
    const [editingBlock, setEditingBlock] = useState(null);
    const [active, setActive] = useState("all");

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
     * @param blocks
     * @param categories
     * @returns {*}
     */
    const getBlocksList = useCallback(
        ({ blocks, categories }) => {
            const activeCategory = categories.active;
            if (!activeCategory) {
                return [];
            }

            let output = blocks;

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

            return output;
        },
        [search]
    );

    const getCategoryBlocksCount = useCallback(({ plugins, category }) => {
        return getBlocksList({
            blocks: plugins.blocks,
            categories: { active: category }
        }).length;
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

    const renderBlocksList = useCallback(
        ({ plugins, category, deleteElement, updateElement, blocksList }) => {
            const categoryPlugin = plugins.categories.list.find(pl => pl.categoryName === category);

            return (
                <SimpleForm>
                    <SimpleFormHeader title={categoryPlugin.title} icon={categoryPlugin.icon} />
                    <SimpleFormContent>
                        <Styled.BlockList>
                            <BlocksList
                                category={category}
                                addBlock={addBlockToContent}
                                deactivatePlugin={deactivatePlugin}
                                blocks={blocksList}
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
                            onSubmit={data => updateBlock({ data, updateElement })}
                            open={!!editingBlock}
                            plugin={editingBlock}
                        />
                    </SimpleFormContent>
                </SimpleForm>
            );
        },
        [editingBlock, addBlockToContent, deleteBlock, updateBlock]
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

    const plugins: Object = {
        categories: {
            list: [allBlockCategory, ...getPlugins("pb-editor-block-category")],
            active
        },
        blocks: getPlugins("pb-editor-block")
    };

    const blocksList = getBlocksList(plugins);

    const onExited = useCallback(() => {
        deactivatePlugin({ name: "pb-editor-search-blocks-bar" });
    }, []);

    return (
        <OverlayLayout barMiddle={renderSearchInput()} onExited={onExited}>
            <SplitView>
                <LeftPanel span={3}>
                    <List twoLine className={listStyle}>
                        {plugins.categories.list.map(p => (
                            <ListItem
                                key={p.name}
                                className={listItem}
                                onClick={() => {
                                    setActive(p.categoryName);
                                }}
                            >
                                <ListItemGraphic>
                                    <Icon icon={p.icon} />
                                </ListItemGraphic>
                                <TitleContent>
                                    <ListItemTitle>
                                        {p.title} (
                                        {getCategoryBlocksCount({
                                            plugins,
                                            category: p.categoryName
                                        })}
                                        )
                                    </ListItemTitle>
                                    <Typography use={"subtitle2"}>{p.description}</Typography>
                                </TitleContent>
                            </ListItem>
                        ))}
                    </List>
                </LeftPanel>
                <RightPanel span={9}>
                    <Mutation mutation={updateElementGql}>
                        {updateElement => (
                            <Mutation mutation={deleteElementGql}>
                                {deleteElement =>
                                    plugins.categories.active &&
                                    renderBlocksList({
                                        plugins,
                                        category: active,
                                        deleteElement,
                                        updateElement,
                                        blocksList
                                    })
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
