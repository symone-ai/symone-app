import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  RefreshCw,
  Shield,
  Lock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Search,
  Server,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { api } from '@/lib/api';

interface Secret {
  id: string;
  key: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

const Secrets = () => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    setLoading(true);
    try {
      const data = await api.user.getSecrets();
      setSecrets(data);
    } catch (error) {
      console.error('Failed to load secrets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSecret = async () => {
    if (!newSecretKey.trim() || !newSecretValue.trim()) {
      alert('Please provide both key and value');
      return;
    }
    setCreating(true);
    try {
      await api.user.createSecret(newSecretKey, newSecretValue);
      setShowCreateDialog(false);
      setNewSecretKey('');
      setNewSecretValue('');
      await loadSecrets();
    } catch (error: any) {
      console.error('Failed to create secret:', error);
      alert(error.message || 'Failed to create secret');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    if (!confirm('Are you sure you want to delete this secret? This action cannot be undone.')) {
      return;
    }
    try {
      await api.user.deleteSecret(secretId);
      await loadSecrets();
    } catch (error: any) {
      console.error('Failed to delete secret:', error);
      alert(error.message || 'Failed to delete secret');
    }
  };

  const toggleShow = (id: string) => {
    setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Secrets</h1>
          <p className="text-muted-foreground">Securely manage API keys and credentials</p>
        </div>
        <Button variant="hero" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Secret
        </Button>
      </div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">End-to-End Encryption</p>
              <p className="text-sm text-muted-foreground">All secrets are encrypted at rest using AES-256 and in transit using TLS 1.3</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Secrets', value: secrets.length, icon: Key, color: 'text-primary' },
            { label: 'Encrypted', value: secrets.length, icon: Shield, color: 'text-success' },
            { label: 'Last Updated', value: secrets.length > 0 ? 'Today' : 'Never', icon: Calendar, color: 'text-accent' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{typeof stat.value === 'number' ? stat.value : stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search secrets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Secrets List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : secrets.filter(secret =>
            secret.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            secret.description?.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No secrets configured</p>
            <p className="text-muted-foreground mb-4">
              Securely store API keys and credentials for your MCP servers
            </p>
            <Button variant="hero" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Secret
            </Button>
          </div>
        ) : (
          secrets.filter(secret =>
            secret.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            secret.description?.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((secret, index) => (
            <motion.div
              key={secret.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-mono font-semibold text-foreground">{secret.key}</h3>
                      </div>

                      {/* Value - secrets are always masked since we don't store plain text */}
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm text-muted-foreground font-mono bg-secondary px-2 py-1 rounded">
                          ••••••••••••••••
                        </code>
                        <span className="text-xs text-muted-foreground">(encrypted)</span>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created {new Date(secret.created_at).toLocaleDateString()}
                        </span>
                        {secret.description && (
                          <span>{secret.description}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSecret(secret.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Secret Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Secret</DialogTitle>
            <DialogDescription>
              Store an encrypted API key or credential for your MCP servers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="secret-key">Secret Key</Label>
              <Input
                id="secret-key"
                placeholder="e.g., SLACK_BOT_TOKEN"
                value={newSecretKey}
                onChange={(e) => setNewSecretKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-value">Secret Value</Label>
              <Input
                id="secret-value"
                type="password"
                placeholder="Enter the secret value"
                value={newSecretValue}
                onChange={(e) => setNewSecretValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSecret} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Secret'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Secrets;
