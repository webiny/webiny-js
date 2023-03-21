import React, { useCallback, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import orderBy from "lodash/orderBy";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { plugins } from "@webiny/plugins";
import { OverlayLayout } from "@webiny/app-admin/components/OverlayLayout";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { ScrollList, ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as SearchIcon } from "~/editor/assets/icons/search.svg";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { useRecoilState, useRecoilValue } from "recoil";

import { ReactComponent as AllIcon } from "./icons/round-clear_all-24px.svg";
import createBlockPlugin from "~/admin/utils/createBlockPlugin";
import BlocksList from "./BlocksList";
import { UPDATE_PAGE_BLOCK, DELETE_PAGE_BLOCK } from "~/admin/views/PageBlocks/graphql";
import EditBlockDialog from "./EditBlockDialog";
import {
    IconWrapper,
    listItem,
    activeListItem,
    ListItemTitle,
    listStyle,
    TitleContent
} from "./SearchBlocksStyled";
import * as Styled from "./StyledComponents";
import { PbEditorBlockCategoryPlugin, PbEditorBlockPlugin, PbEditorElement } from "~/types";
import { elementWithChildrenByIdSelector, rootElementAtom } from "~/editor/recoil/modules";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useKeyHandler } from "~/editor/hooks/useKeyHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import { createBlockElements } from "~/editor/helpers";
import { createBlockReference } from "~/pageEditor/helpers";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { blocksBrowserStateAtom } from "~/pageEditor/config/blockEditing/state";

const allBlockCategory: PbEditorBlockCategoryPlugin = {
    type: "pb-editor-block-category",
    name: "pb-editor-block-category-all",
    categoryName: "all",
    title: "All blocks",
    description: "List of all available blocks.",
    icon: <AllIcon />
};

const sortBlocks = (blocks: PbEditorBlockPlugin[]): PbEditorBlockPlugin[] => {
    return blocks.sort(function (a, b) {
        if (a.name === "pb-editor-block-empty") {
            return -1;
        }

        if (b.name === "pb-editor-block-empty") {
            return 1;
        }

        if (a.title < b.title) {
            return -1;
        }
        if (a.title > b.title) {
            return 1;
        }
        return 0;
    });
};

const SearchBar = () => {
    const [, setBlocksBrowserState] = useRecoilState(blocksBrowserStateAtom);
    const rootElementId = useRecoilValue(rootElementAtom);
    const content = useRecoilValue(
        elementWithChildrenByIdSelector(rootElementId)
    ) as PbEditorElement;
    const eventActionHandler = useEventActionHandler();

    const [search, setSearch] = useState<string>("");
    const [editingBlock, setEditingBlock] = useState<PbEditorBlockPlugin | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("all");

    const [updatePageElementMutation, { loading: updateInProgress }] =
        useMutation(UPDATE_PAGE_BLOCK);
    const [deletePageElementMutation] = useMutation(DELETE_PAGE_BLOCK);

    const allCategories = useMemo(
        () => [
            allBlockCategory,
            ...orderBy(
                plugins.byType<PbEditorBlockCategoryPlugin>("pb-editor-block-category"),
                "title",
                "asc"
            )
        ],
        []
    );

    const allBlocks = plugins.byType<PbEditorBlockPlugin>("pb-editor-block");

    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    const deactivatePlugin = () => {
        setBlocksBrowserState(false);
    };

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            deactivatePlugin();
        });

        return () => removeKeyHandler("escape");
    }, []);

    const addBlockToContent = useCallback(
        plugin => {
            const blockToAdd = plugin.tags.includes("saved")
                ? createBlockReference(plugin.name)
                : createBlockElements(plugin.name);

            const element: any = {
                ...content,
                elements: [...content.elements, blockToAdd]
            };
            eventActionHandler.trigger(
                new UpdateElementActionEvent({
                    element,
                    history: true,
                    triggerUpdateElementTree: true
                })
            );

            deactivatePlugin();
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
                    return item.blockCategory === activeCategory;
                });
            }
        }

        // Finally, filter by typed search term.
        if (search) {
            output = output.filter(item => {
                return item.title.toLowerCase().includes(search.toLowerCase());
            });
        }

        return sortBlocks(output);
    };

    const getCategoryBlocksCount = useCallback(category => {
        if (category === "all") {
            return allBlocks.length;
        }
        return allBlocks.filter(pl => pl.blockCategory === category).length;
    }, []);

    const { showSnackbar } = useSnackbar();

    const deleteBlock = useCallback(async ({ plugin, deleteElement }) => {
        const response = await deleteElement({
            variables: {
                id: plugin.id
            }
        });

        const { error } = response.data.pageBuilder.deletePageBlock;
        if (error) {
            showSnackbar(error.message);
            return;
        }

        plugins.unregister(plugin.name);
        showSnackbar(
            <span>
                Block <strong>{plugin.title}</strong> was deleted!
            </span>
        );
    }, []);

    const updateBlock = useCallback(
        async ({ updateElement, data: { title: name, blockCategory } }) => {
            if (!editingBlock) {
                return;
            }

            const response = await updateElement({
                variables: {
                    id: editingBlock.id,
                    data: { name, blockCategory }
                }
            });

            const { error, data } = response.data.pageBuilder.pageBlock;
            if (error) {
                showSnackbar(error.message);
                return;
            }

            // This will replace previously registered block plugin.
            createBlockPlugin(data);

            setEditingBlock(null);
            setTimeout(() => {
                // For better UX, success message is shown after 300ms.
                showSnackbar(
                    <span>
                        Block <strong>{name}</strong> was saved!
                    </span>
                );
            }, 300);
        },
        [editingBlock]
    );

    const renderSearchInput = useCallback(() => {
        return (
            <Styled.Input>
                <Icon className={Styled.searchIcon} icon={<SearchIcon />} />
                <DelayedOnChange value={search} onChange={(value: string) => setSearch(value)}>
                    {({ value, onChange }) => (
                        <input
                            autoFocus
                            type={"text"}
                            placeholder="Search blocks..."
                            value={value}
                            onChange={ev => onChange(ev.target.value)}
                        />
                    )}
                </DelayedOnChange>
            </Styled.Input>
        );
    }, [search]);

    const onExited = useCallback(() => {
        deactivatePlugin();
    }, []);

    const categoryPlugin = allCategories.find(pl => pl.categoryName === activeCategory) || {
        title: null,
        icon: <></>
    };

    return (
        <OverlayLayout barMiddle={renderSearchInput()} onExited={onExited}>
            <SplitView>
                <LeftPanel span={3}>
                    <ScrollList className={listStyle}>
                        {allCategories.map(p => (
                            <ListItem
                                key={p.name}
                                className={classNames(
                                    listItem,
                                    activeCategory === p.categoryName && activeListItem
                                )}
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
                                    <Typography use={"body2"}>{p.description}</Typography>
                                </TitleContent>
                            </ListItem>
                        ))}
                    </ScrollList>
                </LeftPanel>
                <RightPanel span={9}>
                    {activeCategory && (
                        <SimpleForm>
                            <SimpleFormHeader
                                title={categoryPlugin.title}
                                icon={<IconWrapper>{categoryPlugin.icon}</IconWrapper>}
                            />
                            <SimpleFormContent>
                                <Styled.BlockList>
                                    <BlocksList
                                        category={activeCategory}
                                        addBlock={addBlockToContent}
                                        // deactivatePlugin={deactivatePlugin}
                                        blocks={getBlocksList()}
                                        onEdit={plugin => setEditingBlock(plugin)}
                                        onDelete={plugin =>
                                            deleteBlock({
                                                plugin,
                                                deleteElement: deletePageElementMutation
                                            })
                                        }
                                    />
                                </Styled.BlockList>

                                <EditBlockDialog
                                    onClose={() => setEditingBlock(null)}
                                    onSubmit={data =>
                                        updateBlock({
                                            data,
                                            updateElement: updatePageElementMutation
                                        })
                                    }
                                    open={!!editingBlock}
                                    plugin={editingBlock}
                                    loading={updateInProgress}
                                />
                            </SimpleFormContent>
                        </SimpleForm>
                    )}
                </RightPanel>
            </SplitView>
        </OverlayLayout>
    );
};

export default SearchBar;
