import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/loom/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — loom." },
      { name: "description", content: "Loom's draft terms covering the 18+ requirement, university non-affiliation and code of conduct." },
      { property: "og:title", content: "Terms of Service — loom." },
      { property: "og:description", content: "Draft terms for Loom's campus pilot, including university non-affiliation. Not yet finalized." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalLayout title="Terms of Service">
      <LegalSection title="18+ Age Mandate">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae justo eget magna fermentum iaculis. Sed euismod, neque sit amet facilisis tincidunt, risus lorem consequat erat, a elementum mi libero id nisi.</p>
      </LegalSection>
      <LegalSection title="University Non-Affiliation">
        <p className="text-foreground">Loom is an independent third-party service and is not affiliated with, sponsored by, or endorsed by the University of Washington or any academic institution.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris non tempor quam. Suspendisse potenti. Donec dignissim, arcu vel posuere tincidunt, lorem erat ultrices lacus, ut consequat erat neque vitae sapien.</p>
      </LegalSection>
      <LegalSection title="Zero Tolerance Code of Conduct">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a nibh vitae lorem placerat cursus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae. Nulla facilisi.</p>
      </LegalSection>
    </LegalLayout>
  );
}