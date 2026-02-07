import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings2,
  Save,
  Loader2,
  Trash2,
  LogOut,
  AlertTriangle,
  Users,
  Calendar,
  Crown,
  ArrowRightLeft,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { user as userApi, api } from '@/lib/api';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  role: string;
}

interface WorkspaceData {
  id: string;
  name: string;
  plan: string;
  quota_limit: number;
  usage_count: number;
  description: string;
  member_count: number;
  created_at: string;
  role: string;
}

export default function WorkspaceSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [transferTarget, setTransferTarget] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    try {
      const data = await userApi.getWorkspaceSettings();
      setWorkspace(data);
      setName(data.name);
      setDescription(data.description || '');

      // Load team members for ownership transfer
      try {
        const membersResult = await api.user.getTeamMembers();
        if (membersResult.success && membersResult.members) {
          setTeamMembers(membersResult.members.filter((m: any) => m.role !== 'owner'));
        }
      } catch { /* ignore */ }
    } catch (error: any) {
      toast.error('Failed to load workspace settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) return;
    setTransferring(true);
    try {
      await api.user.transferOwnership(transferTarget);
      toast.success('Ownership transferred successfully');
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error.message || 'Failed to transfer ownership');
    } finally {
      setTransferring(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userApi.updateWorkspaceSettings({
        name: name.trim(),
        description: description.trim(),
      });

      // Update localStorage
      const storedUser = localStorage.getItem('symone_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.team_name = name.trim();
        localStorage.setItem('symone_user', JSON.stringify(userData));
      }

      toast.success('Workspace settings updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await userApi.deleteWorkspace();
      toast.success('Workspace deleted');
      // Reload to switch to the new active workspace
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete workspace');
    }
  };

  const handleLeave = async () => {
    try {
      await userApi.leaveWorkspace();
      toast.success('Left workspace');
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave workspace');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No workspace found
      </div>
    );
  }

  const isOwner = workspace.role === 'owner';
  const isAdmin = workspace.role === 'admin' || isOwner;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace configuration and preferences
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Your Role</span>
            </div>
            <p className="text-lg font-semibold capitalize mt-1">{workspace.role}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Members</span>
            </div>
            <p className="text-lg font-semibold mt-1">{workspace.member_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Created</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              {workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            General
          </CardTitle>
          <CardDescription>
            Basic workspace information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ws-name">Workspace Name</Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-desc">Description</Label>
            <Textarea
              id="ws-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
              disabled={!isAdmin}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label>Plan</Label>
              <div>
                <Badge variant="outline" className="capitalize">
                  {workspace.plan}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Usage</Label>
              <p className="text-sm text-muted-foreground">
                {workspace.usage_count.toLocaleString()} / {workspace.quota_limit.toLocaleString()} requests
              </p>
            </div>
          </div>

          {isAdmin && (
            <Button
              onClick={handleSave}
              disabled={saving || name.trim().length < 2}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for this workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isOwner && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Leave Workspace</p>
                <p className="text-sm text-muted-foreground">
                  Remove yourself from this workspace
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will lose access to all servers, secrets, and data in "{workspace.name}".
                      You'll need a new invitation to rejoin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeave} className="bg-destructive text-destructive-foreground">
                      Leave Workspace
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {isOwner && teamMembers.length > 0 && (
            <div className="p-4 border rounded-lg space-y-3">
              <div>
                <p className="font-medium flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer Ownership
                </p>
                <p className="text-sm text-muted-foreground">
                  Transfer workspace ownership to another team member. You'll become an admin.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                >
                  <option value="">Select a team member...</option>
                  {teamMembers.map((m) => (
                    <option key={m.user_id || m.id} value={m.user_id || m.id}>
                      {m.name} ({m.email}) - {m.role}
                    </option>
                  ))}
                </select>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={!transferTarget || transferring}>
                      {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Transfer'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Transfer ownership?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will make the selected member the new owner of "{workspace.name}".
                        Your role will be changed to admin. This action is irreversible without the new owner's consent.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleTransferOwnership}>
                        Transfer Ownership
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {isOwner && (
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <p className="font-medium text-destructive">Delete Workspace</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this workspace and all its data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{workspace.name}" and all associated data including
                      servers, secrets, activity logs, and team memberships. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
