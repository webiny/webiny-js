import React from "react";
import get from "lodash/get.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ListMenuCmsGroupsQueryResponse } from "~/admin/viewsGraphql.js";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "~/admin/viewsGraphql.js";
import useQuery from "~/admin/hooks/useQuery.js";
import { usePermission } from "~/admin/hooks/usePermission.js";
import type { CmsGroup, CmsModel } from "~/types.js";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useRouter, AdminConfig } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

const { Menu } = AdminConfig;

interface HasContentEntryPermissionsProps {
  group: CmsGroup;
  contentModel?: CmsModel;
  children: JSX.Element;
}

const HasContentEntryPermissions = ({
  group,
  contentModel,
  children,
}: HasContentEntryPermissionsProps) => {
  const { canReadEntries } = usePermission();

  if (contentModel) {
    if (!canReadEntries({ contentModelGroup: group, contentModel })) {
      return null;
    }
  } else {
    const hasContentEntryPermission = group.contentModels.some((contentModel) =>
      canReadEntries({
        contentModelGroup: group,
        contentModel,
      })
    );

    if (group.contentModels.length > 0 && !hasContentEntryPermission) {
      return null;
    }
  }

  return children;
};

interface IconProps {
  group: CmsGroup;
}

const Icon = ({ group }: IconProps) => {
  return (
    <FontAwesomeIcon
      style={{ color: "var(--mdc-theme-text-secondary-on-background)" }}
      icon={(group.icon || "").split("/") as IconProp}
    />
  );
};

export const ContentGroupsMenuItems = () => {
  const router = useRouter();
  const response = useQuery<ListMenuCmsGroupsQueryResponse>(
    LIST_MENU_CONTENT_GROUPS_MODELS
  );
  const groups: CmsGroup[] =
    get(response, "data.listContentModelGroups.data") || [];

  if (!groups || groups.length === 0) {
    return null;
  }

  /**
   * Renders a menu item for a given content group.
   * Displays the group's name and icon in the menu.
   */
  const GroupMenu = ({ group }: { group: CmsGroup }) => (
    <Menu
      name={group.id}
      parent="headlessCMSContent"
      element={
        <Menu.Item
          text={group.name}
          icon={
            <Menu.Link.Icon label="Content" element={<Icon group={group} />} />
          }
        />
      }
    />
  );

  /**
   * Renders menu items for all content models within a group.
   * If the group has no content models, displays a "Nothing to show" message.
   * Wraps each content model menu item with permission checks.
   */
  const GroupContentModels = ({ group }: { group: CmsGroup }) => {
    if (group.contentModels.length === 0) {
      return (
        <Menu
          parent="headlessCMSContent"
          name={`${group.id}-empty`}
          element={<Menu.Group text="Nothing to show" />}
        />
      );
    }

    return (
      <>
        {group.contentModels.map((contentModel) => (
          <HasContentEntryPermissions
            key={contentModel.modelId}
            group={group}
            contentModel={contentModel}
          >
            <Menu
              parent={group.id}
              name={contentModel.modelId}
              element={
                <Menu.Link
                  text={contentModel.name}
                  to={router.getLink(Routes.ContentEntries.List, {
                    modelId: contentModel.modelId,
                  })}
                />
              }
            />
          </HasContentEntryPermissions>
        ))}
      </>
    );
  };

  return (
    <>
      {groups.map((group) => (
        <HasContentEntryPermissions key={group.id} group={group}>
          <>
            <GroupMenu group={group} />
            <GroupContentModels group={group} />
          </>
        </HasContentEntryPermissions>
      ))}
    </>
  );
};
