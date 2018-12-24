export async function loadEntityScopes() {
    // TODO: rebuild scopes catalogue for the user when a Group is updated or assigned to the user,
    // or a Role is updated or assigned to the user to avoid digging through everything each time we need to access user scopes
    // (as we do now to get things going) - "we'll do it later" ™
    const scopes = [];
    const groups = await this.groups;
    // Get scopes via `groups` relation
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const roles = await group.roles;
        for (let j = 0; j < roles.length; j++) {
            const role = roles[j];
            role.scopes.forEach(scope => scopes.push(scope));
        }
    }

    // Get scopes via `roles` relation
    const roles = await this.roles;
    for (let j = 0; j < roles.length; j++) {
        const role = roles[j];
        role.scopes.forEach(scope => scopes.push(scope));
    }

    return [...new Set(scopes)];
}
