import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/code-highlight/styles.css";
import "highlight.js/styles/atom-one-dark.css";
import "@filter-builder/mantine/theme/brand";
import "nextra-theme-docs/style.css";
import "./overrides.scss";

import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import type { ReactNode } from "react";

import { MantineRoot } from "./providers";

export const metadata = {
  title: {
    default: "filter-builder",
    template: "%s · filter-builder",
  },
  description:
    "A shadcn-style filter builder, ported across Mantine, Style-X, and Tailwind (shadcn) variants.",
};

const navbar = (
  <Navbar
    logo={<b>filter-builder</b>}
    projectLink="https://github.com/rocketmakers/filter-builder"
  />
);

const footer = (
  <Footer>
    MIT {new Date().getFullYear()} © Rocketmakers.
  </Footer>
);

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning {...mantineHtmlProps}>
      <Head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </Head>
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/rocketmakers/filter-builder/tree/main/packages/docs"
          footer={footer}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          toc={{ backToTop: null }}
        >
          <MantineRoot>{children}</MantineRoot>
        </Layout>
      </body>
    </html>
  );
}
