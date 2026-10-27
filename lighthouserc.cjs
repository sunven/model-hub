module.exports = {
  ci: {
    collect: {
      staticDistDir: './out',
      numberOfRuns: 3,
      url: ['/', '/models/anthropic/claude-opus-5-5.html', '/leaderboards/text.html', '/about.html'],
    },
    assert: {
      aggregationMethod: 'median',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
