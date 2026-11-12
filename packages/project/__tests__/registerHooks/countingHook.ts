import { AdminAfterBuild } from "~/abstractions/index.js";

export const calls = { count: 0 };

class CountingHook implements AdminAfterBuild.Interface {
    async execute() {
        calls.count++;
    }
}

export default AdminAfterBuild.createImplementation({
    implementation: CountingHook,
    dependencies: []
});
