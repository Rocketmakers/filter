import nextra from "nextra";

const withNextra = nextra({
  defaultShowCopyCode: true,
});

export default withNextra({
  reactStrictMode: true,
  transpilePackages: ["@filter-builder/mantine", "@filter-builder/demo-code"],
  sassOptions: {
    silenceDeprecations: ["legacy-js-api", "import"],
  },
});
