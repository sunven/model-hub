/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
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
        chunks: 'all',
        minChunks: 2,
        enforce: true,
        priority: 50,
      }
    }
    return config
  },
}

export default nextConfig
