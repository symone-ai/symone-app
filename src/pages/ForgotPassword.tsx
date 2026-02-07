import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { user as userApi } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stagingToken, setStagingToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await userApi.forgotPassword(email);
      setSent(true);
      // In staging, show the token for testing
      if (response._staging_token) {
        setStagingToken(response._staging_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl text-foreground">
            Symone<span className="text-primary">MCP</span>
          </span>
        </Link>

        <Card className="border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              {sent
                ? "Check your email for a reset link"
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
                  </p>
                </div>

                {stagingToken && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-medium text-amber-500 mb-1">Staging Only - Reset Link:</p>
                    <Link
                      to={`/reset-password?token=${stagingToken}`}
                      className="text-sm text-primary hover:underline break-all"
                    >
                      /reset-password?token={stagingToken}
                    </Link>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => { setSent(false); setStagingToken(null); }}>
                    Try another email
                  </Button>
                  <Link to="/login">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>

                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
