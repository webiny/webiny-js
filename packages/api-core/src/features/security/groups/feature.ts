import { createFeature } from "@webiny/feature/api";
import { GroupsRepository } from "./shared/GroupsRepository.js";
import { GetGroupFeature } from "./GetGroup/feature.js";
import { ListGroupsFeature } from "./ListGroups/feature.js";
import { CreateGroupFeature } from "./CreateGroup/feature.js";
import { UpdateGroupFeature } from "./UpdateGroup/feature.js";
import { DeleteGroupFeature } from "./DeleteGroup/feature.js";
import { GroupInstaller } from "~/features/groups/Installer/GroupsInstaller.js";

export const GroupsFeature = createFeature({
    name: "Groups",
    register(container) {
        // Register repository in singleton scope
        container.register(GroupsRepository).inSingletonScope();

        // Register all use cases
        GetGroupFeature.register(container);
        ListGroupsFeature.register(container);
        CreateGroupFeature.register(container);
        UpdateGroupFeature.register(container);
        DeleteGroupFeature.register(container);

        container.register(GroupInstaller);
    }
});
