import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Code,
  Zap,
  Moon,
  Sun,
  Check,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Webhook,
  Plus,
  Trash2,
  Play,
  Download,
  Copy,
  CheckCircle,
  XCircle,
  RefreshCw,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useUpdateUser } from '@/hooks/useSymoneData';
import { api } from '@/lib/api';

interface WebhookEndpoint {
  id: string;
  name: string;
  type: string;
  endpoint_url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at?: string;
  failure_count: number;
}

const Settings = () => {
  const { toast } = useToast();
  const { data: user, isLoading: userLoading } = useUser();
  const updateUser = useUpdateUser();

  const [activeSection, setActiveSection] = useState('general');
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    slack: false,
    errors: true,
    deploys: true,
    usage: false,
  });

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<Array<{
    id: string;
    name: string;
    prefix: string;
    created_at: string;
    description?: string;
    last_used_at?: string;
  }>>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [rotatingKey, setRotatingKey] = useState<string | null>(null);
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<{
    id: string;
    name: string;
    key: string;
    created_at: string;
  } | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    endpoint_url: '',
    events: ['tool_failure'],
  });

  // Export state
  const [exporting, setExporting] = useState(false);

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Load API keys and webhooks when section is active
  useEffect(() => {
    if (activeSection === 'api') {
      loadApiKeys();
      loadWebhooks();
    }
  }, [activeSection]);

  const loadApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const keys = await api.user.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({ title: 'Please enter a name for the API key', variant: 'destructive' });
      return;
    }
    setGeneratingKey(true);
    try {
      const newKey = await api.user.createApiKey(newKeyName, newKeyDescription || undefined);
      setNewlyGeneratedKey(newKey);
      setShowCreateKeyDialog(false);
      setNewKeyName('');
      setNewKeyDescription('');
      await loadApiKeys();
      toast({ title: 'API key created successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to generate API key', description: error.message, variant: 'destructive' });
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRotateApiKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to rotate "${keyName}"? The old key will be immediately revoked.`)) {
      return;
    }
    setRotatingKey(keyId);
    try {
      const newKey = await api.user.rotateApiKey(keyId);
      setNewlyGeneratedKey(newKey);
      await loadApiKeys();
      toast({ title: 'API key rotated successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to rotate API key', description: error.message, variant: 'destructive' });
    } finally {
      setRotatingKey(null);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    try {
      await api.user.revokeApiKey(keyId);
      await loadApiKeys();
      toast({ title: 'API key deleted' });
    } catch (error: any) {
      toast({ title: 'Failed to delete API key', description: error.message, variant: 'destructive' });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: 'Copied to clipboard' });
  };

  // Webhook handlers
  const loadWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      const result = await api.user.getWebhooks();
      setWebhooks(result.webhooks || []);
    } catch (error: any) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.endpoint_url) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setCreatingWebhook(true);
    try {
      await api.user.createWebhook(newWebhook);
      toast({ title: 'Webhook created successfully' });
      setShowAddWebhook(false);
      setNewWebhook({ name: '', endpoint_url: '', events: ['tool_failure'] });
      await loadWebhooks();
    } catch (error: any) {
      toast({ title: 'Failed to create webhook', description: error.message, variant: 'destructive' });
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await api.user.deleteWebhook(webhookId);
      toast({ title: 'Webhook deleted' });
      await loadWebhooks();
    } catch (error: any) {
      toast({ title: 'Failed to delete webhook', description: error.message, variant: 'destructive' });
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhook(webhookId);
    try {
      const result = await api.user.testWebhook(webhookId);
      if (result.success) {
        toast({ title: 'Test notification sent successfully' });
      } else {
        toast({ title: 'Test failed', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Test failed', description: error.message, variant: 'destructive' });
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleExportConfig = async () => {
    setExporting(true);
    try {
      const result = await api.user.exportConfig();
      const blob = new Blob([JSON.stringify(result.export, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `symone-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Configuration exported successfully' });
    } catch (error: any) {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateUser.mutateAsync({
        firstName,
        lastName,
        email,
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await api.user.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'api', label: 'API & Webhooks', icon: Code },
  ];

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-secondary'
        }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-6' : 'left-1'
          }`}
      />
    </button>
  );

  // Get avatar initials from user data
  const avatarInitials = user?.avatar ||
    (user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how Symone looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-accent" />}
                      <div>
                        <p className="font-medium text-foreground">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                      </div>
                    </div>
                    <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Default Region</CardTitle>
                  <CardDescription>Default deployment region for new servers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1'].map((region) => (
                      <button
                        key={region}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${region === 'us-east-1'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary text-muted-foreground hover:border-primary/50'
                          }`}
                      >
                        <Globe className="w-4 h-4 mx-auto mb-1" />
                        {region}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div>
                      <p className="font-medium text-foreground">Delete Workspace</p>
                      <p className="text-sm text-muted-foreground">Permanently delete this workspace and all data</p>
                    </div>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-2xl font-semibold text-primary">{avatarInitials}</span>
                        </div>
                        <Button variant="outline" size="sm">Change Avatar</Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <Button
                        variant="hero"
                        onClick={handleSaveProfile}
                        disabled={updateUser.isPending}
                      >
                        {updateUser.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Notification Channels</CardTitle>
                  <CardDescription>Choose how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                    { key: 'slack', label: 'Slack Integration', desc: 'Send alerts to Slack channel' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Toggle
                        enabled={notifications[item.key as keyof typeof notifications]}
                        onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>Choose what you want to be notified about</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'errors', label: 'Server Errors', desc: 'Get alerted when servers encounter errors' },
                    { key: 'deploys', label: 'Deployments', desc: 'Notifications for deployment status' },
                    { key: 'usage', label: 'Usage Alerts', desc: 'Alerts when approaching limits' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Toggle
                        enabled={notifications[item.key as keyof typeof notifications]}
                        onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-center gap-3">
                      <Shield className="w-8 h-8 text-success" />
                      <div>
                        <p className="font-medium text-foreground">2FA Enabled</p>
                        <p className="text-sm text-muted-foreground">Your account is protected with 2FA</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-success">{passwordSuccess}</p>
                  )}
                  <Button
                    variant="hero"
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage your active sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { device: 'Chrome on MacOS', location: 'San Francisco, US', current: true },
                    { device: 'Safari on iPhone', location: 'San Francisco, US', current: false },
                    { device: 'Firefox on Windows', location: 'New York, US', current: false },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{session.device}</p>
                          {session.current && (
                            <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{session.location}</p>
                      </div>
                      {!session.current && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'billing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Manage your subscription</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Zap className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Team Plan</p>
                          <p className="text-sm text-muted-foreground">$99/month • Billed monthly</p>
                        </div>
                      </div>
                      <Button variant="outline">Upgrade</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-2xl font-bold text-foreground">10</p>
                        <p className="text-sm text-muted-foreground">Servers</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">100K</p>
                        <p className="text-sm text-muted-foreground">Requests/mo</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">5</p>
                        <p className="text-sm text-muted-foreground">Team members</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage This Month</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Servers', used: 7, limit: 10 },
                    { label: 'Requests', used: 68000, limit: 100000, format: (n: number) => `${(n / 1000).toFixed(0)}K` },
                    { label: 'Storage', used: 2.4, limit: 10, format: (n: number) => `${n}GB` },
                  ].map((item) => {
                    const percentage = (item.used / item.limit) * 100;
                    const format = item.format || ((n: number) => n.toString());
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(item.used)} / {format(item.limit)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${percentage > 90 ? 'bg-destructive' : percentage > 70 ? 'bg-accent' : 'bg-primary'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'api' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage your API keys for programmatic access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingKeys ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {newlyGeneratedKey && (
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-green-600 dark:text-green-400 mb-1">New API Key Generated</p>
                              <p className="text-sm text-muted-foreground mb-3">
                                Copy this key now - you won't be able to see it again!
                              </p>
                              <p className="font-mono text-sm bg-background p-2 rounded break-all">
                                {newlyGeneratedKey.key}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyKey(newlyGeneratedKey.key)}
                            >
                              Copy
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNewlyGeneratedKey(null)}
                            className="mt-2"
                          >
                            Done
                          </Button>
                        </div>
                      )}

                      {apiKeys.length > 0 ? (
                        apiKeys.map((key) => (
                          <div key={key.id} className="p-4 rounded-lg bg-secondary/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Key className="w-5 h-5 text-primary" />
                                <div>
                                  <p className="font-medium text-foreground">{key.name}</p>
                                  <p className="text-sm text-muted-foreground font-mono">{key.prefix}...</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRotateApiKey(key.id, key.name)}
                                  disabled={rotatingKey === key.id}
                                  title="Rotate key"
                                >
                                  {rotatingKey === key.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteApiKey(key.id)}
                                  title="Delete key"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                              {key.last_used_at ? (
                                <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                              ) : (
                                <span className="text-amber-600">Never used</span>
                              )}
                            </div>
                            {key.description && (
                              <p className="text-sm text-muted-foreground">{key.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No API keys yet</p>
                          <p className="text-sm mt-1">Create an API key to access the Symone API programmatically</p>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => setShowCreateKeyDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create API Key
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Webhooks</CardTitle>
                      <CardDescription>Configure webhook endpoints for events</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowAddWebhook(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Webhook
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingWebhooks ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : webhooks.length > 0 ? (
                    webhooks.map((webhook) => (
                      <div key={webhook.id} className="p-4 rounded-lg bg-secondary/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Webhook className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">{webhook.name}</p>
                              <p className="text-sm text-muted-foreground font-mono truncate max-w-[300px]">
                                {webhook.endpoint_url}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {webhook.is_active ? (
                              <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/30">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestWebhook(webhook.id)}
                              disabled={testingWebhook === webhook.id}
                            >
                              {testingWebhook === webhook.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteWebhook(webhook.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {webhook.last_triggered_at && (
                          <p className="text-xs text-muted-foreground">
                            Last triggered: {new Date(webhook.last_triggered_at).toLocaleString()}
                          </p>
                        )}
                        {webhook.failure_count > 0 && (
                          <p className="text-xs text-amber-600">
                            {webhook.failure_count} consecutive failure{webhook.failure_count > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Webhook className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-foreground font-medium mb-2">No webhooks configured</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add a webhook to receive event notifications
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export Configuration Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Configuration</CardTitle>
                  <CardDescription>Download your team configuration as JSON</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Download className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Export Config</p>
                        <p className="text-sm text-muted-foreground">
                          Includes servers, secrets (masked), and settings
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleExportConfig}
                      disabled={exporting}
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Add Webhook Dialog */}
          <Dialog open={showAddWebhook} onOpenChange={setShowAddWebhook}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Webhook Endpoint</DialogTitle>
                <DialogDescription>
                  Configure a URL to receive event notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="webhook-name">Name</Label>
                  <Input
                    id="webhook-name"
                    placeholder="My Webhook"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Endpoint URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://example.com/webhook"
                    value={newWebhook.endpoint_url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, endpoint_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Events</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['tool_failure', 'quota_warning', 'quota_exceeded', 'server_error', 'server_down', 'rate_limited'].map((event) => (
                      <label key={event} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                            } else {
                              setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(ev => ev !== event) });
                            }
                          }}
                          className="rounded border-border"
                        />
                        {event.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddWebhook(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWebhook} disabled={creatingWebhook}>
                  {creatingWebhook ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Webhook'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create API Key Dialog */}
          <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Generate a new API key for programmatic access to Symone
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="key-name">Name *</Label>
                  <Input
                    id="key-name"
                    placeholder="Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A descriptive name to identify this key
                  </p>
                </div>
                <div>
                  <Label htmlFor="key-description">Description (optional)</Label>
                  <Input
                    id="key-description"
                    placeholder="Used for CI/CD pipeline integration"
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                  />
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-600">
                      The API key will only be shown once after creation. Make sure to copy it immediately.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreateKeyDialog(false);
                  setNewKeyName('');
                  setNewKeyDescription('');
                }}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateApiKey} disabled={generatingKey || !newKeyName.trim()}>
                  {generatingKey ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Key'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Settings;
