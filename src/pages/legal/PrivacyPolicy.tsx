import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">
            Symone<span className="text-primary">MCP</span>
          </span>
        </Link>

        <Link to="/signup" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sign Up
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, password (hashed)</li>
              <li><strong>Team Information:</strong> Team name, member roles, workspace configuration</li>
              <li><strong>Usage Data:</strong> API calls, tool executions, server configurations</li>
              <li><strong>Session Data:</strong> IP address, device type, user agent, session timestamps</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your requests and tool executions</li>
              <li>Monitor usage for quota enforcement and billing</li>
              <li>Detect and prevent fraud, abuse, and security incidents</li>
              <li>Send service-related communications</li>
              <li>Generate aggregated analytics (non-personally identifiable)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Data Storage and Security</h2>
            <p>Your data is stored on secure infrastructure provided by Google Cloud Platform and Supabase. We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption at rest and in transit (TLS 1.3)</li>
              <li>Row Level Security (RLS) for multi-tenant data isolation</li>
              <li>Hashed passwords using bcrypt</li>
              <li>API key encryption for stored secrets</li>
              <li>Audit logging for all administrative actions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Service Providers:</strong> Cloud hosting (Google Cloud), database (Supabase), and analytics providers necessary to operate the Service</li>
              <li><strong>Third-Party Integrations:</strong> When you connect MCP servers (Slack, n8n, etc.), data is transmitted to those services per their own privacy policies</li>
              <li><strong>Legal Requirements:</strong> When required by law, subpoena, or legal process</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We use localStorage to persist your login state and preferences. We do not use third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
            <p>We retain your data for as long as your account is active. Activity logs are retained for 90 days. Upon account deletion, we remove your personal data within 30 days, except where retention is required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Object to data processing</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:privacy@symone.com" className="text-primary hover:underline">privacy@symone.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Children's Privacy</h2>
            <p>The Service is not intended for users under 16 years of age. We do not knowingly collect data from children.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of material changes via email or a prominent notice in the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
            <p>For privacy-related inquiries, contact us at <a href="mailto:privacy@symone.com" className="text-primary hover:underline">privacy@symone.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
