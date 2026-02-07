import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plug,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronRight,
  Server,
  Zap,
  Database,
  Slack,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, McpConnectionInfo } from '@/lib/api';

type AgentType = 'claude_desktop' | 'cursor' | 'windsurf' | 'custom';
type McpMode = 'standard' | 'optimized' | 'advanced';

const iconMap: Record<string, React.ElementType> = {
  slack: Slack,
  n8n: Zap,
  supabase: Database,
  default: Server,
};

const modeDescriptions: Record<McpMode, { label: string; description: string; badge: string }> = {
  standard: {
    label: 'Standard',
    description: 'All tools loaded upfront. Best for simple setups with fewer than 10 tools.',
    badge: 'Baseline',
  },
  optimized: {
    label: 'Optimized',
    description: 'Tools include PTC annotations and output filtering. Reduces token usage by ~37%.',
    badge: 'Recommended',
  },
  advanced: {
    label: 'Advanced',
    description: 'Only a search_tools meta-tool is exposed. Tools load on demand. Best for 50+ tools.',
    badge: 'Coming Soon',
  },
};

const Connections = () => {
  const [connectionInfo, setConnectionInfo] = useState<McpConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentType>('claude_desktop');
  const [copied, setCopied] = useState(false);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [savingMode, setSavingMode] = useState(false);

  const loadConnectionInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.user.getMcpConnectionInfo();
      setConnectionInfo(data);
    } catch (err) {
      setError('Failed to load connection info');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnectionInfo();
  }, []);

  const getConfigSnippet = (): string => {
    if (!connectionInfo) return '';

    const workspaceLabel = connectionInfo.workspace_name.toLowerCase().replace(/\s+/g, '-');
    const config = {
      mcpServers: {
        [`symone-${workspaceLabel}`]: {
          url: connectionInfo.connection_url,
          headers: {
            'X-Symone-Key': '<your-api-key>',
          },
        },
      },
    };

    if (activeAgent === 'custom') {
      return `# SSE Connection\nURL: ${connectionInfo.connection_url}\nHeader: X-Symone-Key: <your-api-key>\n\n# JSON Config\n${JSON.stringify(config, null, 2)}`;
    }

    return JSON.stringify(config, null, 2);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getConfigSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getConfigSnippet()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeAgent === 'claude_desktop'
      ? 'claude_desktop_config.json'
      : 'mcp_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleModeChange = async (mode: McpMode) => {
    if (!connectionInfo || mode === 'advanced') return; // advanced is coming soon
    setSavingMode(true);
    try {
      await api.user.updateMcpMode(mode);
      setConnectionInfo({ ...connectionInfo, current_mode: mode });
    } catch (err) {
      console.error('Failed to update mode:', err);
    } finally {
      setSavingMode(false);
    }
  };

  const handleServerModeChange = async (serverId: string, mode: string) => {
    if (!connectionInfo) return;
    try {
      await api.user.updateMcpMode(mode, serverId);
      setConnectionInfo({
        ...connectionInfo,
        enabled_servers: connectionInfo.enabled_servers.map(s =>
          s.id === serverId ? { ...s, mcp_mode: mode === 'inherit' ? null : mode } : s
        ),
      });
    } catch (err) {
      console.error('Failed to update server mode:', err);
    }
  };

  const toggleServer = (serverId: string) => {
    setExpandedServers(prev => {
      const next = new Set(prev);
      if (next.has(serverId)) next.delete(serverId);
      else next.add(serverId);
      return next;
    });
  };

  const currentTokens = connectionInfo
    ? connectionInfo.estimated_tokens[connectionInfo.current_mode]
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
        <AlertCircle className="w-4 h-4 inline mr-2" />
        {error}
      </div>
    );
  }

  if (!connectionInfo) return null;

  const hasServers = connectionInfo.enabled_servers.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Connections</h1>
        <p className="text-muted-foreground">
          Connect your AI agent to Symone with a single endpoint
        </p>
      </div>

      {!hasServers ? (
        /* Empty state */
        <Card>
          <CardContent className="p-12 text-center">
            <Plug className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No servers deployed</h2>
            <p className="text-muted-foreground mb-4">
              Deploy an MCP server first, then come back here to connect your agent.
            </p>
            <Link to="/dashboard/marketplace">
              <Button variant="hero">Deploy Server</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Connection URL */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Your Symone Endpoint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 bg-secondary rounded-lg p-3">
                  <code className="flex-1 text-sm font-mono text-foreground break-all">
                    {connectionInfo.connection_url}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(connectionInfo.connection_url);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Agent Config */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agent Tabs */}
                <div className="flex gap-2">
                  {([
                    ['claude_desktop', 'Claude Desktop'],
                    ['cursor', 'Cursor'],
                    ['windsurf', 'Windsurf'],
                    ['custom', 'Custom'],
                  ] as const).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={activeAgent === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveAgent(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                {/* Config Snippet */}
                <div className="relative">
                  <pre className="bg-secondary rounded-lg p-4 text-sm font-mono text-foreground overflow-x-auto max-h-64 overflow-y-auto">
                    {getConfigSnippet()}
                  </pre>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Replace {'<your-api-key>'} with your API key from Settings &gt; API Keys
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Execution Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Execution Mode
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    ~{currentTokens.toLocaleString()} tokens overhead
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(Object.entries(modeDescriptions) as [McpMode, typeof modeDescriptions.standard][]).map(
                    ([mode, info]) => (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        disabled={savingMode || mode === 'advanced'}
                        className={`relative p-4 rounded-lg border text-left transition-all ${
                          connectionInfo.current_mode === mode
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : mode === 'advanced'
                            ? 'border-border opacity-50 cursor-not-allowed'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {info.badge && (
                          <span
                            className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              info.badge === 'Recommended'
                                ? 'bg-primary/10 text-primary'
                                : info.badge === 'Coming Soon'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                          >
                            {info.badge}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full border-2 ${
                              connectionInfo.current_mode === mode
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}
                          />
                          <span className="font-medium text-foreground">{info.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Included Tools */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Included Tools ({connectionInfo.total_tools})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {connectionInfo.enabled_servers.map(server => {
                  const Icon = iconMap[server.type] || iconMap.default;
                  const isExpanded = expandedServers.has(server.id);

                  return (
                    <div key={server.id} className="border border-border rounded-lg">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => toggleServer(server.id)}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="font-medium text-foreground">{server.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({server.tool_count} tools)
                          </span>
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          <select
                            value={server.mcp_mode || 'inherit'}
                            onChange={e => handleServerModeChange(server.id, e.target.value)}
                            className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground"
                          >
                            <option value="inherit">Inherit</option>
                            <option value="standard">Standard</option>
                            <option value="optimized">Optimized</option>
                          </select>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-border px-4 py-3 bg-secondary/30">
                          <p className="text-xs text-muted-foreground">
                            {server.type} server &middot; {server.tool_count} tools available
                            &middot; Status: {server.status}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Connections;
