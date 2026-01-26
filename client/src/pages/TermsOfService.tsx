import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-display text-4xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground mt-1">Rules & Usage</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">CollabR18x — Terms of Service (Rules & Usage)</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            By accessing or using CollabR18x ("the Platform"), you agree to comply with the following Terms of Service. 
            Failure to comply may result in suspension or permanent removal.
          </p>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">1. Eligibility & Age Requirements</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.1</span>
                <span>You must be at least 18 years of age to use the Platform.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.2</span>
                <span>All users must complete identity and age verification before accessing discovery, messaging, or collaboration features.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">1.3</span>
                <span>Any attempt to misrepresent age or identity will result in immediate termination.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">2. Account Verification & Authenticity</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.1</span>
                <span>All users must maintain accurate and truthful profile information.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.2</span>
                <span>Impersonation of another individual or creator is strictly prohibited.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.3</span>
                <span>CollabR18x reserves the right to request re-verification at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">2.4</span>
                <span>Verified status may be revoked if authenticity cannot be confirmed.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">3. Purpose of the Platform</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.1</span>
                <span>CollabR18x is a professional networking and collaboration platform for adult content creators.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.2</span>
                <span>The Platform does not host or distribute explicit adult content.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">3.3</span>
                <span>The Platform is not a fan site, escorting service, or marketplace for sexual services.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">4. Consent & Boundaries</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">4.1</span>
                <span>All interactions must be consensual, voluntary, and respectful.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">4.2</span>
                <span>Users are required to clearly state personal boundaries within their profile.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">4.3</span>
                <span>Collaboration planning tools require explicit acknowledgement of boundaries and consent by all parties.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">4.4</span>
                <span>Any form of coercion, pressure, or manipulation is strictly prohibited.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">5. Prohibited Conduct</h2>
            <p className="text-muted-foreground mb-3">Users may NOT:</p>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside ml-4">
              <li>Engage in harassment, hate speech, or threats</li>
              <li>Solicit or offer sexual services in exchange for money</li>
              <li>Use language implying non-consensual activity</li>
              <li>Share or request illegal content</li>
              <li>Attempt to bypass safety or moderation systems</li>
              <li>Use the Platform for trafficking, exploitation, or coercion</li>
              <li>Share another person's private information without consent</li>
            </ul>
            <p className="text-muted-foreground mt-3 font-semibold">Violations may result in immediate account termination.</p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">6. Messaging & Media Sharing</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">6.1</span>
                <span>Messaging is permitted only after mutual interest or matching.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">6.2</span>
                <span>Media sharing, where enabled, must comply with Platform rules and local laws.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">6.3</span>
                <span>Explicit sexual content is not permitted in public areas or community spaces.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">6.4</span>
                <span>CollabR18x reserves the right to moderate or restrict messaging features to ensure safety.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">7. Payments & Financial Interactions</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">7.1</span>
                <span>CollabR18x does not process payments between users.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">7.2</span>
                <span>Financial arrangements between collaborators occur off-platform and at users' own discretion.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">7.3</span>
                <span>Language implying escorting, prostitution, or pay-for-sex is prohibited.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">8. Community Guidelines</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">8.1</span>
                <span>Community spaces are for professional discussion, education, and networking.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">8.2</span>
                <span>Explicit sexual descriptions are not permitted in public forums.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">8.3</span>
                <span>Repeated violations of community standards may result in restricted access or removal.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">9. Safety, Reporting & Enforcement</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">9.1</span>
                <span>Users may block or report other users at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">9.2</span>
                <span>CollabR18x reserves the right to investigate reports and take appropriate action.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">9.3</span>
                <span>Enforcement actions may include warnings, feature restrictions, suspension, or permanent removal.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">9.4</span>
                <span>CollabR18x is not required to disclose internal moderation decisions.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">10. Privacy & Data Protection</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">10.1</span>
                <span>Personal data is handled in accordance with applicable privacy laws.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">10.2</span>
                <span>Identity verification data is stored securely and separately.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">10.3</span>
                <span>Users may request account deletion and data removal as required by law.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">10.4</span>
                <span>Approximate location data may be displayed; precise location sharing is optional.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">11. Termination</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">11.1</span>
                <span>Users may terminate their account at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">11.2</span>
                <span>CollabR18x reserves the right to terminate accounts that violate these Terms without notice.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">11.3</span>
                <span>Termination does not remove responsibility for prior violations.</span>
              </li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-bold mb-3">12. Modifications</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">12.1</span>
                <span>CollabR18x may update these Terms at any time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground">12.2</span>
                <span>Continued use of the Platform constitutes acceptance of updated Terms.</span>
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
