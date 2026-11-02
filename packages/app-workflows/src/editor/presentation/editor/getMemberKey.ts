// One key per set of teams, whatever the order of the ids (the member options are kept per set).
export const getMemberKey = (stepTeamIds: string[]): string => {
    const sorted = [...stepTeamIds].sort();
    return sorted.join(",");
};
