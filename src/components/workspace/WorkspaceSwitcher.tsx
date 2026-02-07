import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { user as userApi } from '@/lib/api';
import { toast } from 'sonner';

interface WorkspaceTeam {
  id: string;
  name: string;
  plan: string;
  role: string;
}

interface WorkspaceSwitcherProps {
  onSwitch?: (team: WorkspaceTeam) => void;
}

const planColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-blue-500/10 text-blue-500',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-amber-500/10 text-amber-500',
};

export function WorkspaceSwitcher({ onSwitch }: WorkspaceSwitcherProps) {
  const [teams, setTeams] = useState<WorkspaceTeam[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await userApi.listWorkspaces();
      setTeams(data.teams || []);
      setActiveTeamId(data.active_team_id);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (teamId: string) => {
    if (teamId === activeTeamId) return;

    try {
      const team = await userApi.switchTeam(teamId);
      setActiveTeamId(teamId);

      // Update localStorage with new team context
      const storedUser = localStorage.getItem('symone_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.team_id = team.id;
        userData.team_name = team.name;
        userData.role = team.role;
        localStorage.setItem('symone_user', JSON.stringify(userData));
      }

      toast.success(`Switched to ${team.name}`);
      onSwitch?.(team);

      // Reload the page to refresh all dashboard data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to switch workspace');
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);

    try {
      const team = await userApi.createWorkspace(newName.trim());
      setTeams(prev => [...prev, { ...team, role: 'owner' }]);
      setCreateOpen(false);
      setNewName('');
      toast.success(`Workspace "${team.name}" created`);

      // Switch to the new workspace
      await handleSwitch(team.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const activeTeam = teams.find(t => t.id === activeTeamId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-2 h-auto py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">
                  {activeTeam?.name?.charAt(0)?.toUpperCase() || 'W'}
                </span>
              </div>
              <span className="text-sm font-medium truncate">
                {activeTeam?.name || 'Select workspace'}
              </span>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Workspaces
          </DropdownMenuLabel>
          {teams.map((team) => (
            <DropdownMenuItem
              key={team.id}
              onClick={() => handleSwitch(team.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{team.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{team.plan} plan</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${planColors[team.plan] || ''}`}>
                  {team.role}
                </Badge>
                {team.id === activeTeamId && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize a different project or team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                placeholder="My New Project"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
