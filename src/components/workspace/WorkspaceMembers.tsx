import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Plus,
    Mail,
    Shield,
    Crown,
    User,
    Clock,
    CheckCircle2,
    XCircle,
    Trash2,
    Send,
    X,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface TeamMember {
    id: string;
    user_id?: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    avatar: string;
    status: 'active' | 'pending' | 'inactive';
    lastActive?: string;
    servers?: number;
}

interface PendingInvite {
    id: string;
    email: string;
    role: string;
    status: string;
    invited_by: string;
    expires_at: string;
    created_at: string;
}

interface WorkspaceMembersProps {
    userRole: 'owner' | 'admin' | 'member' | 'viewer';
}

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin', description: 'Can manage servers and invite members' },
    { value: 'member', label: 'Member', description: 'Can deploy and manage servers' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
] as const;

export function WorkspaceMembers({ userRole }: WorkspaceMembersProps) {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
    const [inviting, setInviting] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [resendingId, setResendingId] = useState<string | null>(null);

    const canManageMembers = userRole === 'owner' || userRole === 'admin';
    const canChangeRoles = userRole === 'owner';

    // Load team members from API
    const loadTeamMembers = async () => {
        try {
            const result = await api.user.getTeamMembers();
            if (result.success && result.members) {
                setMembers(result.members.map((m: any) => {
                    // Calculate lastActive from created_at or updated_at
                    const lastDate = new Date(m.created_at || m.updated_at || Date.now());
                    const now = new Date();
                    const diffMs = now.getTime() - lastDate.getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    let lastActive = 'Active';
                    if (diffDays > 30) lastActive = `${Math.floor(diffDays / 30)}mo ago`;
                    else if (diffDays > 0) lastActive = `${diffDays}d ago`;
                    else if (diffHours > 0) lastActive = `${diffHours}h ago`;
                    else lastActive = 'Now';

                    const nameParts = (m.name || 'User').split(' ');
                    const initials = nameParts.map((n: string) => n[0]?.toUpperCase() || '').join('').slice(0, 2);

                    return {
                        ...m,
                        role: m.role as TeamMember['role'],
                        status: (m.status || 'active') as TeamMember['status'],
                        lastActive,
                        avatar: initials || 'U',
                        servers: m.server_count || 0
                    };
                }));
            }
        } catch (error) {
            console.error('Failed to load team members:', error);
            // Fall back to current user only
            const storedUser = localStorage.getItem('symone_user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    const nameParts = (user.name || 'User').split(' ');
                    const initials = nameParts.map((n: string) => n[0]?.toUpperCase() || '').join('').slice(0, 2);
                    setMembers([{
                        id: user.id || '1',
                        name: user.name || 'You',
                        email: user.email || '',
                        role: user.role as TeamMember['role'] || 'owner',
                        avatar: initials || 'YO',
                        status: 'active',
                        lastActive: 'Now',
                        servers: 0
                    }]);
                } catch (e) {
                    console.error('Failed to parse user:', e);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const loadPendingInvites = async () => {
        if (!canManageMembers) return;
        try {
            const result = await api.user.listPendingInvites();
            if (result.success) {
                setPendingInvites(result.invites || []);
            }
        } catch {
            // Non-critical - user may not be admin
        }
    };

    useEffect(() => {
        loadTeamMembers();
        loadPendingInvites();
    }, []);

    const handleCancelInvite = async (inviteId: string) => {
        setCancellingId(inviteId);
        try {
            const result = await api.user.cancelInvite(inviteId);
            if (result.success) {
                toast({ title: 'Invite cancelled', description: 'The invitation has been cancelled' });
                loadPendingInvites();
            }
        } catch (error: any) {
            toast({ title: 'Failed', description: error.message, variant: 'destructive' });
        } finally {
            setCancellingId(null);
        }
    };

    const handleResendInvite = async (inviteId: string) => {
        setResendingId(inviteId);
        try {
            const result = await api.user.resendInvite(inviteId);
            if (result.success) {
                toast({ title: 'Invite resent', description: 'Expiry has been extended by 7 days' });
                loadPendingInvites();
            }
        } catch (error: any) {
            toast({ title: 'Failed', description: error.message, variant: 'destructive' });
        } finally {
            setResendingId(null);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;

        setInviting(true);
        try {
            const result = await api.user.inviteTeamMember(inviteEmail, inviteRole);
            if (result.success) {
                toast({
                    title: 'Invitation sent',
                    description: result.message || `Invite sent to ${inviteEmail}`,
                });
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteRole('member');
                loadTeamMembers();
                loadPendingInvites();
            }
        } catch (error: any) {
            toast({
                title: 'Failed to invite',
                description: error.message || 'Could not send invitation',
                variant: 'destructive',
            });
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (memberId: string, memberRole: string) => {
        if (memberRole === 'owner') {
            toast({
                title: 'Cannot remove owner',
                description: 'Transfer ownership first before removing the owner',
                variant: 'destructive',
            });
            return;
        }

        setRemovingId(memberId);
        try {
            const result = await api.user.removeTeamMember(memberId);
            if (result.success) {
                toast({
                    title: 'Member removed',
                    description: 'Team member has been removed',
                });
                loadTeamMembers();
            }
        } catch (error: any) {
            toast({
                title: 'Failed to remove',
                description: error.message || 'Could not remove member',
                variant: 'destructive',
            });
        } finally {
            setRemovingId(null);
        }
    };

    const getRoleBadge = (role: TeamMember['role']) => {
        switch (role) {
            case 'owner':
                return (
                    <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
                        <Crown className="w-3 h-3 mr-1" />
                        Owner
                    </Badge>
                );
            case 'admin':
                return (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                    </Badge>
                );
            case 'member':
                return (
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                        <User className="w-3 h-3 mr-1" />
                        Member
                    </Badge>
                );
            case 'viewer':
                return (
                    <Badge variant="secondary">
                        <User className="w-3 h-3 mr-1" />
                        Viewer
                    </Badge>
                );
        }
    };

    const getStatusIndicator = (status: TeamMember['status']) => {
        switch (status) {
            case 'active':
                return <span className="w-2 h-2 rounded-full bg-green-500" />;
            case 'pending':
                return <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />;
            case 'inactive':
                return <span className="w-2 h-2 rounded-full bg-muted-foreground" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Invite Team Member</h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowInviteModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {ROLE_OPTIONS.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label} - {role.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                                    {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Send Invite
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Team Members', value: members.length, icon: Users, color: 'text-primary' },
                    { label: 'Active', value: members.filter(m => m.status === 'active').length, icon: CheckCircle2, color: 'text-green-500' },
                    { label: 'Pending Invites', value: pendingInvites.length, icon: Mail, color: 'text-amber-500' },
                    { label: 'Admins', value: members.filter(m => m.role === 'admin' || m.role === 'owner').length, icon: Shield, color: 'text-primary' },
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
                                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Roles Explanation */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Role Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { role: 'Owner', desc: 'Full access including billing and team management', icon: Crown, color: 'text-amber-500' },
                            { role: 'Admin', desc: 'Can manage servers, secrets, and invite members', icon: Shield, color: 'text-primary' },
                            { role: 'Member', desc: 'Can deploy and manage assigned servers', icon: User, color: 'text-green-500' },
                            { role: 'Viewer', desc: 'Read-only access to assigned servers', icon: User, color: 'text-muted-foreground' },
                        ].map((item) => (
                            <div key={item.role} className="p-3 rounded-lg bg-secondary/50">
                                <div className={`flex items-center gap-2 mb-1 ${item.color}`}>
                                    <item.icon className="w-4 h-4" />
                                    <span className="font-medium">{item.role}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Pending Invites */}
            {canManageMembers && pendingInvites.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Mail className="w-5 h-5 text-amber-500" />
                            Pending Invites ({pendingInvites.length})
                        </CardTitle>
                        <CardDescription>These people have been invited but haven't accepted yet</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingInvites.map((invite) => (
                                <div
                                    key={invite.id}
                                    className="p-4 rounded-lg bg-secondary/50 flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">{invite.email}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="capitalize">{invite.role}</span>
                                            <span>·</span>
                                            <span>Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleResendInvite(invite.id)}
                                            disabled={resendingId === invite.id}
                                            title="Resend invite"
                                        >
                                            {resendingId === invite.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleCancelInvite(invite.id)}
                                            disabled={cancellingId === invite.id}
                                            title="Cancel invite"
                                        >
                                            {cancellingId === invite.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Team Members List */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Team Members
                        </CardTitle>
                    </div>
                    {canManageMembers && (
                        <Button onClick={() => setShowInviteModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Invite Member
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {members.map((member, index) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="text-lg font-semibold text-primary">{member.avatar}</span>
                                        </div>
                                        <div className="absolute bottom-0 right-0 p-0.5 bg-card rounded-full">
                                            {getStatusIndicator(member.status)}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-foreground">{member.name}</h3>
                                            {getRoleBadge(member.role)}
                                            {member.status === 'pending' && (
                                                <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>

                                    {/* Meta */}
                                    <div className="text-right text-sm text-muted-foreground">
                                        <p className="flex items-center gap-1 justify-end">
                                            <Clock className="w-3 h-3" />
                                            {member.lastActive}
                                        </p>
                                        <p>{member.servers} servers</p>
                                    </div>

                                    {/* Actions */}
                                    {canManageMembers && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {member.role !== 'owner' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleRemove(member.id, member.role)}
                                                    disabled={removingId === member.id}
                                                    title="Remove member"
                                                >
                                                    {removingId === member.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
