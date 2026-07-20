import { useState } from "react";
import { Container, SegmentedControl } from "@mantine/core";

import { FILTER_PARAM as AND_OR_FILTER_PARAM } from "@/components/ui/and-or-filter-builder";

import App from "./App";
import AndOrApp from "./AndOrApp";

type Page = "grouped" | "and-or";

/** Deep-links from either builder's URL-synced filter state should land on the right tab. */
function initialPage(): Page {
  if (typeof window === "undefined") return "grouped";
  return new URLSearchParams(window.location.search).has(AND_OR_FILTER_PARAM) ? "and-or" : "grouped";
}

export default function Root() {
  const [page, setPage] = useState<Page>(initialPage);

  return (
    <>
      <Container size="xl" pt="md">
        <SegmentedControl
          value={page}
          onChange={(v) => setPage(v as Page)}
          data={[
            { label: "Grouped filter builder", value: "grouped" },
            { label: "AND/OR filter builder", value: "and-or" },
          ]}
        />
      </Container>
      {page === "grouped" ? <App /> : <AndOrApp />}
    </>
  );
}
