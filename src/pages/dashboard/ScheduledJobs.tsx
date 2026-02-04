import { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Server,
  Edit,
  History,
  Zap,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, ScheduledJob, JobExecution, UserServer } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Common cron presets
const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9 AM', value: '0 9 * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
  { label: 'First of month at 9 AM', value: '0 9 1 * *' },
];

// Available tools per server type
const TOOLS_BY_SERVER: Record<string, string[]> = {
  slack: ['post_message', 'list_channels', 'get_channel_history', 'search_messages'],
  n8n: ['list_workflows', 'execute_workflow', 'get_workflow', 'get_executions'],
  supabase: ['run_query', 'list_tables', 'select_rows', 'insert_rows'],
};

export default function ScheduledJobs() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [servers, setServers] = useState<UserServer[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);

  // Create form state
  const [newJob, setNewJob] = useState({
    name: '',
    server_id: '',
    tool_name: '',
    cron_expression: '0 9 * * *',
    timezone: 'UTC',
    parameters: '{}',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, serversRes, statsRes] = await Promise.all([
        api.user.getScheduledJobs(),
        api.user.getServers(),
        api.user.getScheduledJobStats(),
      ]);
      setJobs(jobsRes.jobs || []);
      setServers(serversRes || []);
      setStats(statsRes.stats);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    try {
      let params = {};
      try {
        params = JSON.parse(newJob.parameters);
      } catch {
        toast({
          title: 'Invalid JSON',
          description: 'Parameters must be valid JSON',
          variant: 'destructive',
        });
        return;
      }

      const response = await api.user.createScheduledJob({
        name: newJob.name,
        server_id: newJob.server_id,
        tool_name: newJob.tool_name,
        cron_expression: newJob.cron_expression,
        timezone: newJob.timezone,
        parameters: params,
      });

      toast({
        title: 'Job created',
        description: response.message,
      });

      setShowCreateDialog(false);
      setNewJob({
        name: '',
        server_id: '',
        tool_name: '',
        cron_expression: '0 9 * * *',
        timezone: 'UTC',
        parameters: '{}',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error creating job',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleJob = async (job: ScheduledJob) => {
    try {
      const response = await api.user.toggleScheduledJob(job.id);
      toast({
        title: response.is_active ? 'Job resumed' : 'Job paused',
        description: response.message,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error toggling job',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteJob = async (job: ScheduledJob) => {
    if (!confirm(`Delete job "${job.name}"? This cannot be undone.`)) return;

    try {
      await api.user.deleteScheduledJob(job.id);
      toast({
        title: 'Job deleted',
        description: `${job.name} has been deleted`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error deleting job',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRunNow = async (job: ScheduledJob) => {
    try {
      toast({
        title: 'Running job...',
        description: `Executing ${job.name}`,
      });

      const response = await api.user.runScheduledJobNow(job.id);

      if (response.success) {
        toast({
          title: 'Job completed',
          description: `Completed in ${response.duration_ms}ms`,
        });
      } else {
        toast({
          title: 'Job failed',
          description: response.error || 'Unknown error',
          variant: 'destructive',
        });
      }
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error running job',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleViewHistory = async (job: ScheduledJob) => {
    setSelectedJob(job);
    setShowHistoryDialog(true);
    setExecutionsLoading(true);

    try {
      const response = await api.user.getScheduledJobHistory(job.id, 50);
      setExecutions(response.executions || []);
    } catch (error: any) {
      toast({
        title: 'Error loading history',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setExecutionsLoading(false);
    }
  };

  const getServerType = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    return server?.type || 'unknown';
  };

  const formatCron = (cron: string) => {
    const preset = CRON_PRESETS.find(p => p.value === cron);
    return preset?.label || cron;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scheduled jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Jobs</h1>
          <p className="text-muted-foreground">Automate recurring tool executions with cron scheduling</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_jobs}</p>
                  <p className="text-xs text-muted-foreground">Total Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Play className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active_jobs}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_runs}</p>
                  <p className="text-xs text-muted-foreground">Total Runs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.success_rate}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Jobs</CardTitle>
          <CardDescription>
            {jobs.length === 0
              ? 'No scheduled jobs yet. Create one to automate your workflows.'
              : `${jobs.length} job${jobs.length === 1 ? '' : 's'} configured`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-50" />
              <p>No scheduled jobs yet</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Job
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getServerType(job.server_id)}</Badge>
                        <span className="text-sm">{job.tool_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatCron(job.cron_expression)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {job.last_run_status === 'success' && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                        {job.last_run_status === 'error' && (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-sm">{formatDate(job.last_run_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(job.next_run_at)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-green-500">{job.run_count - job.error_count}</span>
                        {' / '}
                        <span className="text-red-500">{job.error_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.is_active ? 'default' : 'secondary'}>
                        {job.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRunNow(job)}
                          title="Run now"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewHistory(job)}
                          title="View history"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleJob(job)}
                          title={job.is_active ? 'Pause' : 'Resume'}
                        >
                          {job.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJob(job)}
                          className="text-red-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Job Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Scheduled Job</DialogTitle>
            <DialogDescription>
              Set up a recurring tool execution with cron scheduling
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Job Name</Label>
              <Input
                id="name"
                placeholder="e.g., Daily Slack Summary"
                value={newJob.name}
                onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server">Server</Label>
              <Select
                value={newJob.server_id}
                onValueChange={(value) => setNewJob({ ...newJob, server_id: value, tool_name: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a server" />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name} ({server.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newJob.server_id && (
              <div className="space-y-2">
                <Label htmlFor="tool">Tool</Label>
                <Select
                  value={newJob.tool_name}
                  onValueChange={(value) => setNewJob({ ...newJob, tool_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tool" />
                  </SelectTrigger>
                  <SelectContent>
                    {(TOOLS_BY_SERVER[getServerType(newJob.server_id)] || []).map((tool) => (
                      <SelectItem key={tool} value={tool}>
                        {tool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select
                value={newJob.cron_expression}
                onValueChange={(value) => setNewJob({ ...newJob, cron_expression: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a schedule" />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cron: {newJob.cron_expression}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parameters">Parameters (JSON)</Label>
              <Input
                id="parameters"
                placeholder='{"channel": "#general", "text": "Hello!"}'
                value={newJob.parameters}
                onChange={(e) => setNewJob({ ...newJob, parameters: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateJob}
              disabled={!newJob.name || !newJob.server_id || !newJob.tool_name}
            >
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Execution History</DialogTitle>
            <DialogDescription>
              {selectedJob?.name} - Recent executions
            </DialogDescription>
          </DialogHeader>

          {executionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No execution history yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((exec) => (
                    <TableRow key={exec.id}>
                      <TableCell>{formatDate(exec.started_at)}</TableCell>
                      <TableCell>
                        {exec.duration_ms ? `${exec.duration_ms}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exec.status === 'success'
                              ? 'default'
                              : exec.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {exec.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-red-500 text-sm">
                        {exec.error_message || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
