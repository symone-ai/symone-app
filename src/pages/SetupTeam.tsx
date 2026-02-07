import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { user as userApi } from '@/lib/api';

const SetupTeam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    // Pre-fill with default team name from stored user
    const storedUser = localStorage.getItem('symone_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.team_name) {
          setTeamName(userData.team_name);
        }
      } catch {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setLoading(true);
    try {
      await userApi.setupTeam(teamName.trim(), description.trim() || undefined);

      // Update localStorage
      const storedUser = localStorage.getItem('symone_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.team_name = teamName.trim();
        localStorage.setItem('symone_user', JSON.stringify(userData));
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to setup team:', error);
      // Still navigate on error - they can change it later
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl text-foreground">
            Symone<span className="text-primary">MCP</span>
          </span>
        </div>

        <Card className="border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Name your workspace</CardTitle>
            <CardDescription>
              This is where your team will manage MCP servers and integrations.
              You can always change this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Workspace Name</Label>
                <Input
                  id="team-name"
                  placeholder="e.g., Acme Corp, My Project"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="What will this workspace be used for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={handleSkip}
                >
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !teamName.trim()}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Get Started
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SetupTeam;
