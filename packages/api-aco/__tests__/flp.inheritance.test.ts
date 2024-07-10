describe("Folder Level Permissions -  Inheritance", () => {
    // Public folders.
    test.todo("folders without permissions are public");

    test.todo("if a folder has one or more custom permissions set, folder is no longer public");

    test.todo(
        "if a user has full access permissions, public folders should contain both public and full access permission in its permission list"
    );

    test.todo(
        "if a child folder has one or more custom permissions set, child folder is no longer public, but parent folder remains public"
    );

    // Custom permissions and overrides.
    test.todo("if a folder has custom permissions, they should be also inherited by its children");

    test.todo(
        "if a child folder overrides custom permissions, in the list of permissions, we should see the inherited and the override permissions"
    );

    test.todo(
        "if a parent folder has a an inherited permission and an override to it, in the child folder, we only see the override permission as the inherited permission"
    );

    test.skip(
        "if the 'public' permission is set on a folder, it and all children should inherit it"
    );

    test.todo(
        "if the 'no-access' permission is set on a folder, it and all children should inherit it"
    );

    // Teams
    test.todo(
        "if current user is receiving permissions from a team, the team permissions should be inherited by the folder"
    );

    test.todo(
        "if current user is receiving permissions from a team and direct assignment, the direct assignment should override the team permissions"
    );
});
