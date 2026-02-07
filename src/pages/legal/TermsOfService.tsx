import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function TermsOfService() {
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

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using the Symone MCP Gateway platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
            <p>Symone provides a multi-tenant Model Context Protocol (MCP) gateway that connects AI agents to external tools and data sources. The Service includes API access, dashboard interfaces, and related infrastructure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Account Registration</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. You must notify us immediately of any unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Transmit viruses, malware, or other harmful code</li>
              <li>Interfere with or disrupt the Service infrastructure</li>
              <li>Exceed rate limits or usage quotas through automated means</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Data and Privacy</h2>
            <p>Your use of the Service is subject to our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. You retain ownership of data you submit through the Service. We process data as necessary to provide the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Service Availability</h2>
            <p>We strive to maintain high availability but do not guarantee uninterrupted service. We may perform maintenance, updates, or modifications that temporarily affect availability. We will provide reasonable notice for planned maintenance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Pricing and Payment</h2>
            <p>Certain features may require a paid subscription. Pricing is available on our website. We reserve the right to change pricing with 30 days notice. Free tier usage is subject to quotas and fair use policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Intellectual Property</h2>
            <p>The Service, including its software, design, and documentation, is owned by Symone. You are granted a limited, non-exclusive license to use the Service for its intended purpose. You may not copy, modify, or create derivative works of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SYMONE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Termination</h2>
            <p>Either party may terminate this agreement at any time. We may suspend or terminate your access for violation of these terms. Upon termination, your right to use the Service ceases and we may delete your data after a 30-day grace period.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Changes to Terms</h2>
            <p>We may update these terms from time to time. We will notify you of material changes via email or through the Service. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:legal@symone.com" className="text-primary hover:underline">legal@symone.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
