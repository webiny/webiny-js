// npm and npx are deliberately absent. Both ship with Node, and every Node release that satisfies
// the constraint below already bundles an npm well past the 10.x we used to require, so checking them
// meant two blocking `execaSync` calls on every CLI run to confirm something Node had guaranteed.
export const constraints = {
    yarn: ">=1.22.21 || >=3",
    node: ">=24"
};
