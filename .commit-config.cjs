module.exports = {
  commitConfig: {
    types: [
      {
        name: 'feat',
        description: 'A new feature',
        aiHint: 'a new feature or capability',
      },
      {
        name: 'fix',
        description: 'A bug fix',
        aiHint: 'a bug fix',
      },
      {
        name: 'docs',
        description: 'Documentation only changes',
        aiHint: 'documentation updates',
      },
      {
        name: 'style',
        description: 'Code style changes (no functionality change)',
        aiHint: 'code style or formatting changes',
      },
      {
        name: 'refactor',
        description: 'Code refactoring',
        aiHint: 'a code refactor or restructuring',
      },
      {
        name: 'perf',
        description: 'Performance improvements',
        aiHint: 'a performance improvement',
      },
      {
        name: 'test',
        description: 'Adding or updating tests',
        aiHint: 'adding or updating tests',
      },
      {
        name: 'chore',
        description: 'Build, tooling, dependencies',
        aiHint: 'dependency updates or build configuration',
      },
      {
        name: 'ci',
        description: 'CI/CD configuration',
        aiHint: 'CI/CD pipeline or configuration changes',
      },
    ],
    scopes: [
      // Add your project-specific scopes here
      // { name: 'api' },
      // { name: 'ui' },
    ],
    subjectLimit: 100,
    allowCustomScopes: true,
    allowBreakingChanges: ['feat', 'fix', 'refactor'],
  },
};
