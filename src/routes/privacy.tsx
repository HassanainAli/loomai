import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, LEGAL_CONTACT } from "@/loom/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — loom." },
      { name: "description", content: "What Loom collects, how AI embeddings power matching, who sees your data, and how to delete it." },
      { property: "og:title", content: "Privacy Policy — loom." },
      { property: "og:description", content: "How Loom handles student data: no selling, no ads, no public profiles, deletion on request." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="text-foreground">The short version: we collect only what we need to verify you, match you, and let you chat. We never sell your data, show ads, or publish public profiles.</p>

      <LegalSection title="1. Who we are">
        <p>Loom is an independent service and is not affiliated with the University of Washington or any academic institution. Data you give Loom is not an "education record" under FERPA, and your school does not receive it.</p>
      </LegalSection>

      <LegalSection title="2. What we collect">
        <ul className="list-disc pl-6 space-y-2">
          <li><span className="text-foreground">Account:</span> .edu email, name, date of birth, campus, and a one-way hash of your password (we never see or store your actual password).</li>
          <li><span className="text-foreground">Profile & preferences:</span> gender, who you want to match with, age range, and onboarding answers.</li>
          <li><span className="text-foreground">Daily prompts:</span> your answers to each day's question.</li>
          <li><span className="text-foreground">Matches & chats:</span> your match decisions and messages sent in Focus Mode.</li>
          <li><span className="text-foreground">Feedback:</span> the reason and optional note you give when ending a connection.</li>
          <li><span className="text-foreground">Technical data:</span> IP address, device and browser info, sign-in sessions, and security logs.</li>
        </ul>
        <p>Information like gender and dating preferences can be sensitive. You provide it voluntarily, and we use it only for matching.</p>
      </LegalSection>

      <LegalSection title="3. How we use it">
        <ul className="list-disc pl-6 space-y-2">
          <li>Verify you are an 18+ student and keep the community safe.</li>
          <li>Run the nightly 8pm drop and Focus Mode chat.</li>
          <li>Improve match quality using exit feedback.</li>
          <li>Prevent fraud, abuse, and security incidents, and comply with the law.</li>
          <li>Send account emails such as verification and password reset.</li>
        </ul>
        <p className="text-foreground">We do not sell or rent your personal information, share it for targeted advertising, or use it to train public AI models.</p>
      </LegalSection>

      <LegalSection title="4. AI & matching">
        <p>Your written answers are sent through an AI gateway to generate "embeddings" — lists of numbers that capture the meaning of text. We compare these numbers between students on the same campus, together with your preferences (gender, age range, blocks, past feedback), to choose matches. Matching is fully automated.</p>
        <p>Embeddings are not biometric data. We do not collect facial geometry, voiceprints, or health data. Match scores are estimates and do not determine anything about you beyond who you are shown.</p>
      </LegalSection>

      <LegalSection title="5. Who can see your data">
        <ul className="list-disc pl-6 space-y-2">
          <li><span className="text-foreground">Your matches</span> see your first name, age, campus, and prompt answers. Only the two people in a Focus Mode chat can read its messages.</li>
          <li><span className="text-foreground">Loom operators</span> may access data when needed to run the Service, investigate safety reports or violations, or fix problems.</li>
          <li><span className="text-foreground">Service providers</span> that host our database, sign-in, email, and AI processing, only to provide the Service to us.</li>
          <li><span className="text-foreground">Legal and safety:</span> when required by law, subpoena, or court order, or when we believe in good faith it is needed to prevent harm.</li>
          <li><span className="text-foreground">Business transfer:</span> if Loom is merged or acquired, data may transfer under this policy.</li>
        </ul>
        <p>Profiles are never public or indexed by search engines.</p>
      </LegalSection>

      <LegalSection title="6. Retention & deletion">
        <p>We keep your data while your account is active. You can request deletion at any time by emailing {LEGAL_CONTACT} from your account email. Within 30 days we permanently delete your profile, preferences, answers, embeddings, matches, and messages. Messages you sent may disappear for the other person as well.</p>
        <p>We may keep limited records where required by law, to resolve disputes, or to prevent banned users from re-registering (for example, a one-way hash of your email). Backups are overwritten on a rolling basis.</p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>Depending on where you live (including Washington's My Health My Data Act and California's CCPA/CPRA, where applicable), you may have the right to access, correct, delete, or receive a copy of your data, and to withdraw consent. Email {LEGAL_CONTACT}. We will not discriminate against you for exercising these rights. We do not respond to "Do Not Track" signals because we do not track you across other sites.</p>
      </LegalSection>

      <LegalSection title="8. Cookies & storage">
        <p>We use only essential browser storage to keep you signed in and the app working. We do not use advertising or third-party tracking cookies.</p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>We use encryption in transit (HTTPS), hashed passwords, and database access rules that limit each user to their own data. No system is 100% secure; if a breach affects your data, we will notify you as required by law.</p>
      </LegalSection>

      <LegalSection title="10. Under 18">
        <p>Loom is for adults 18 and older only. We do not knowingly collect data from anyone under 18 and will delete any such account immediately. Report suspected minors to {LEGAL_CONTACT}.</p>
      </LegalSection>

      <LegalSection title="11. Where data is stored">
        <p>Your data is processed and stored in the United States. By using Loom you consent to that processing.</p>
      </LegalSection>

      <LegalSection title="12. Changes & contact">
        <p>We will post updates here and flag material changes in the app. Questions or requests: {LEGAL_CONTACT}</p>
      </LegalSection>
    </LegalLayout>
  );
}
