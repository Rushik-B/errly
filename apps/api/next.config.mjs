const nextConfig = {
  output: 'standalone',
  /* config options here */
  // Disable styled-jsx as it's not needed for API routes and potentially causing build errors
  compiler: {
    styledJsx: false,
  }
};

export default nextConfig;
