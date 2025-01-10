const { workspaceRoot } = require('@nx/devkit');
const { readCachedProjectGraph } = require('@nx/devkit');

module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': () => {
            const graph = readCachedProjectGraph({ workspace: workspaceRoot });
            const projects = Object.keys(graph.nodes).filter((name) => !name.includes('e2e'));
            return [2, 'always', projects];
        },
    },
};
