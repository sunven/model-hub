/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'export',
  // Deliver metadata before client filters can update robots directives.
  htmlLimitedBots: /.*/,
  images: { unoptimized: true },
  devIndicators: false,
  experimental: {
    optimizePackageImports: [
      '@astryxdesign/core/Table',
      '@astryxdesign/core/Collapsible',
      '@astryxdesign/core/theme',
    ],
  },
  webpack(config, { isServer, dev }) {
    // Inherit icons from the prebuilt parent without runtime theme compilation.
    config.resolve.alias['@astryxdesign/theme-matcha$'] = '@astryxdesign/theme-matcha/built'
    if (!isServer && !dev) {
      config.optimization.splitChunks.cacheGroups.astryx = {
        name: 'astryx',
        test: /[\\/]node_modules[\\/]@astryxdesign[\\/]/,
        // Keep lazy components out of the shared startup bundle.
        chunks: 'initial',
        minChunks: 2,
        maxSize: 512 * 1024,
        enforce: true,
        priority: 50,
      }
    }
    return config
  },
}

export default nextConfig
