import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Loader2,
  ExternalLink,
  FileText,
  Key,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { api, MarketplaceMCP } from '@/lib/api';

interface InstallWizardProps {
  mcp: MarketplaceMCP | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'info' | 'configure' | 'verify' | 'success';

export function InstallWizard({ mcp, open, onOpenChange, onSuccess }: InstallWizardProps) {
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverId, setServerId] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [configCopied, setConfigCopied] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  if (!mcp) return null;

  const requiredSecrets = mcp.required_secrets || [];

  const handleClose = () => {
    setStep('info');
    setError(null);
    setServerId(null);
    setSecrets({});
    setConnectionInfo(null);
    onOpenChange(false);
  };

  const handleInstall = async () => {
    setLoading(true);
    setError(null);

    try {
      // Deploy the server
      const server = await api.user.deployServer({
        name: mcp.name,
        type: mcp.server_type || mcp.slug,
      });

      setServerId(server.id);

      // If no secrets required, go straight to success
      if (requiredSecrets.length === 0) {
        setStep('success');
        // Fetch connection info
        const info = await api.user.getServerConnectionInfo(server.id);
        setConnectionInfo(info.connection);
      } else {
        setStep('configure');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to deploy server');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async () => {
    if (!serverId) return;

    // Validate all secrets are filled
    const missingSecrets = requiredSecrets.filter(key => !secrets[key]?.trim());
    if (missingSecrets.length > 0) {
      setError(`Please fill in all required secrets: ${missingSecrets.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);
    setStep('verify');

    try {
      // Save each secret
      for (const key of requiredSecrets) {
        await api.user.createSecret(key, secrets[key]);
      }

      // Activate the server
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://symone-gateway-jkywi4mtla-uc.a.run.app'}/servers/${serverId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('symone_user_token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to activate server');
      }

      // Fetch connection info
      const info = await api.user.getServerConnectionInfo(serverId);
      setConnectionInfo(info.connection);

      setStep('success');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to configure server');
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  const copyConfig = () => {
    if (connectionInfo?.claude_desktop_config) {
      navigator.clipboard.writeText(JSON.stringify(connectionInfo.claude_desktop_config, null, 2));
      setConfigCopied(true);
      setTimeout(() => setConfigCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mcp.logo_url ? (
              <img src={mcp.logo_url} alt="" className="w-6 h-6" />
            ) : (
              <span className="text-2xl">{mcp.icon}</span>
            )}
            Install {mcp.name}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' && 'Review the server details before installing'}
            {step === 'configure' && 'Configure the required API keys and secrets'}
            {step === 'verify' && 'Verifying your configuration...'}
            {step === 'success' && 'Your server is ready to use!'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          <StepIndicator active={step === 'info'} completed={['configure', 'verify', 'success'].includes(step)} label="1" />
          <div className="w-8 h-0.5 bg-border" />
          <StepIndicator active={step === 'configure'} completed={['verify', 'success'].includes(step)} label="2" />
          <div className="w-8 h-0.5 bg-border" />
          <StepIndicator active={step === 'verify' || step === 'success'} completed={step === 'success'} label="3" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Step: Info */}
        {step === 'info' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{mcp.description}</p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{mcp.category}</Badge>
              {mcp.verified && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </Badge>
              )}
              {mcp.tools_count && (
                <Badge variant="outline">{mcp.tools_count} tools</Badge>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-3 text-sm">
              {mcp.external_url && (
                <a
                  href={mcp.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Website
                </a>
              )}
              {mcp.documentation_url && (
                <a
                  href={mcp.documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <FileText className="w-3 h-3" />
                  Documentation
                </a>
              )}
            </div>

            {/* Required Secrets Preview */}
            {requiredSecrets.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Key className="w-4 h-4" />
                  Required Configuration
                </div>
                <div className="flex flex-wrap gap-1">
                  {requiredSecrets.map(secret => (
                    <Badge key={secret} variant="outline" className="text-xs font-mono">
                      {secret}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleInstall} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  'Install Server'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Configure */}
        {step === 'configure' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the required API keys to configure your {mcp.name} server.
              These will be encrypted and stored securely.
            </p>

            <div className="space-y-3">
              {requiredSecrets.map(secret => (
                <div key={secret} className="space-y-1.5">
                  <Label htmlFor={secret} className="font-mono text-xs">
                    {secret}
                  </Label>
                  <Input
                    id={secret}
                    type="password"
                    placeholder={`Enter ${secret}`}
                    value={secrets[secret] || ''}
                    onChange={(e) => setSecrets({ ...secrets, [secret]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {mcp.documentation_url && (
              <p className="text-xs text-muted-foreground">
                Need help finding your API keys?{' '}
                <a
                  href={mcp.documentation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View documentation
                </a>
              </p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('info')}>
                Back
              </Button>
              <Button onClick={handleConfigure} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  'Configure & Activate'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Verify */}
        {step === 'verify' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying configuration...</p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <p className="font-medium">Server Connected!</p>
              <p className="text-sm text-muted-foreground">
                Your {mcp.name} server is now ready to use.
              </p>
            </div>

            {/* Claude Desktop Config */}
            {connectionInfo?.claude_desktop_config && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Claude Desktop Configuration</Label>
                  <Button variant="ghost" size="sm" onClick={copyConfig}>
                    {configCopied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(connectionInfo.claude_desktop_config, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => window.location.href = '/dashboard/servers'}>
                View Servers
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
        completed
          ? 'bg-primary text-primary-foreground'
          : active
          ? 'bg-primary/20 text-primary border-2 border-primary'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {completed ? <Check className="w-4 h-4" /> : label}
    </div>
  );
}

export default InstallWizard;
