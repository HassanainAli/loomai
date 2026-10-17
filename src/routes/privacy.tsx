import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/loom/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — loom." },
      { name: "description", content: "Loom's draft privacy policy covering university emails, AI embeddings, data retention and deletion." },
      { property: "og:title", content: "Privacy Policy — loom." },
      { property: "og:description", content: "Draft privacy information for Loom's campus pilot. Not yet finalized." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <LegalSection title="Data Collection (.edu emails)">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae justo eget magna fermentum iaculis. Sed euismod, neque sit amet facilisis tincidunt, risus lorem consequat erat, a elementum mi libero id nisi.</p>
      </LegalSection>
      <LegalSection title="Vector Embeddings & AI">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris non tempor quam. Suspendisse potenti. Donec dignissim, arcu vel posuere tincidunt, lorem erat ultrices lacus, ut consequat erat neque vitae sapien.</p>
      </LegalSection>
      <LegalSection title="Data Retention & Right to be Forgotten">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a nibh vitae lorem placerat cursus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae. Nulla facilisi.</p>
      </LegalSection>
    </LegalLayout>
  );
}