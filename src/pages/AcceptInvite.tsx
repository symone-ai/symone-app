import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Loader2, CheckCircle2, AlertCircle, Zap, Lock, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api, userStorage } from '@/lib/api';

interface InviteDetails {
  email: string;
  role: string;
  team_name: string;
  invited_by: string;
  expires_at: string;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const isLoggedIn = !!userStorage.getToken();

  useEffect(() => {
    if (!token) {
      setError('No invite token provided');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const result = await api.user.validateInvite(token);
        if (result.success) {
          setInvite(result.invite);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid or expired invite');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);

    try {
      const result = await api.user.acceptInvite(
        token,
        needsSignup ? name : undefined,
        needsSignup ? password : undefined
      );

      if (result.success) {
        setAccepted(true);
      } else if (result.needs_signup) {
        setNeedsSignup(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          {error && !invite ? (
            <>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  Invalid Invite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">Go to Login</Button>
                </Link>
              </CardContent>
            </>
          ) : accepted ? (
            <>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                  You're in!
                </CardTitle>
                <CardDescription>
                  You've joined {invite?.team_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-foreground">
                    You've been added to <strong>{invite?.team_name}</strong> as a <strong>{invite?.role}</strong>.
                  </p>
                </div>
                {isLoggedIn ? (
                  <Button variant="hero" className="w-full" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button variant="hero" className="w-full">Sign In to Get Started</Button>
                  </Link>
                )}
              </CardContent>
            </>
          ) : invite ? (
            <>
              <CardHeader>
                <CardTitle className="text-2xl">Team Invite</CardTitle>
                <CardDescription>
                  {invite.invited_by} invited you to join {invite.team_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">{invite.team_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Role: <span className="capitalize font-medium text-foreground">{invite.role}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Invited as: <span className="font-medium text-foreground">{invite.email}</span>
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {needsSignup ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create your account to join the team.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={handleAccept}
                      disabled={accepting || !name || !password}
                    >
                      {accepting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                      ) : (
                        'Create Account & Join'
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="hero"
                    className="w-full"
                    onClick={handleAccept}
                    disabled={accepting}
                  >
                    {accepting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
                    ) : (
                      isLoggedIn ? 'Join Team' : 'Accept Invite'
                    )}
                  </Button>
                )}

                {!isLoggedIn && !needsSignup && (
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline">
                      Sign in first
                    </Link>
                  </p>
                )}
              </CardContent>
            </>
          ) : null}
        </Card>
      </motion.div>
    </div>
  );
}
