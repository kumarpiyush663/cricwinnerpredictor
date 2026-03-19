import { useState, useEffect, useCallback } from 'react';
import { adminApi, tournamentApi, matchApi, nominationApi, reportApi } from '../../lib/api';
import { useTournament } from '../../contexts/TournamentContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { 
  Trophy, 
  Users, 
  Target, 
  BarChart3, 
  Plus, 
  RefreshCw, 
  Send,
  Edit,
  Trash2,
  Check,
  Loader2,
  Settings,
  Calendar,
  MapPin,
  Mail,
  FileText,
  AlertCircle,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateIST, formatDate, cn } from '../../lib/utils';

export const AdminPanel = () => {
  const { selectedTournament, tournaments, refreshTournaments } = useTournament();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-panel">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage tournaments, matches, and users</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="hover-lift" data-testid="admin-stat-users">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift" data-testid="admin-stat-tournaments">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_tournaments || 0}</p>
                <p className="text-xs text-muted-foreground">Tournaments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift" data-testid="admin-stat-matches">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.active_matches || 0}</p>
                <p className="text-xs text-muted-foreground">Active Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift" data-testid="admin-stat-predictions">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_predictions || 0}</p>
                <p className="text-xs text-muted-foreground">Predictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6" data-testid="admin-tabs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="nominations">Nominations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab stats={stats} selectedTournament={selectedTournament} />
        </TabsContent>

        <TabsContent value="tournaments">
          <TournamentsTab 
            tournaments={tournaments} 
            refreshTournaments={refreshTournaments}
            refreshStats={fetchStats}
          />
        </TabsContent>

        <TabsContent value="matches">
          <MatchesTab 
            selectedTournament={selectedTournament}
            refreshStats={fetchStats}
          />
        </TabsContent>

        <TabsContent value="nominations">
          <NominationsTab refreshStats={fetchStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, selectedTournament }) => {
  const [finalizing, setFinalizing] = useState(false);

  const handleFinalize = async () => {
    if (!selectedTournament) return;
    
    setFinalizing(true);
    try {
      await reportApi.finalize(selectedTournament.id);
      toast.success('Tournament finalized! Report is now public.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to finalize');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Active Tournament */}
      <Card data-testid="active-tournament-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Active Tournament
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.active_tournament ? (
            <div className="space-y-3">
              <div>
                <p className="font-heading text-xl font-bold">{stats.active_tournament.name}</p>
                <p className="text-sm text-muted-foreground">{stats.active_tournament.format} • {stats.active_tournament.year}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{stats.active_tournament.status}</Badge>
                {stats.active_tournament.report_finalized && (
                  <Badge variant="outline" className="text-emerald-600">Report Published</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Teams: {stats.active_tournament.teams?.join(', ') || 'N/A'}</p>
                <p>Duration: {formatDate(stats.active_tournament.start_date)} - {formatDate(stats.active_tournament.end_date)}</p>
              </div>
              
              {!stats.active_tournament.report_finalized && stats.active_tournament.status !== 'completed' && (
                <Button 
                  onClick={handleFinalize} 
                  disabled={finalizing}
                  className="w-full mt-4 rounded-full"
                  data-testid="finalize-btn"
                >
                  {finalizing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Finalize Tournament & Publish Report
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No active tournament</p>
              <p className="text-sm text-muted-foreground">Create a tournament and set it as active</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      <Card data-testid="pending-invites-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Pending Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-4xl font-bold text-amber-600">{stats?.pending_invites || 0}</p>
            <p className="text-sm text-muted-foreground">users haven't registered yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Tournaments Tab Component
const TournamentsTab = ({ tournaments, refreshTournaments, refreshStats }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    format: 'T20',
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
    teams: '',
    status: 'upcoming'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      format: 'T20',
      year: new Date().getFullYear(),
      start_date: '',
      end_date: '',
      teams: '',
      status: 'upcoming'
    });
    setEditingTournament(null);
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      format: tournament.format,
      year: tournament.year,
      start_date: tournament.start_date.split('T')[0],
      end_date: tournament.end_date.split('T')[0],
      teams: tournament.teams.join(', '),
      status: tournament.status
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        teams: formData.teams.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingTournament) {
        await tournamentApi.update(editingTournament.id, data);
        toast.success('Tournament updated');
      } else {
        await tournamentApi.create(data);
        toast.success('Tournament created');
      }

      await refreshTournaments();
      await refreshStats();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will delete all matches and predictions.')) return;
    
    try {
      await tournamentApi.delete(id);
      await refreshTournaments();
      await refreshStats();
      toast.success('Tournament deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleSetActive = async (id) => {
    try {
      await tournamentApi.update(id, { active_flag: true });
      await refreshTournaments();
      await refreshStats();
      toast.success('Tournament set as active');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  return (
    <Card data-testid="tournaments-tab">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tournaments</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-full" data-testid="create-tournament-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTournament ? 'Edit Tournament' : 'Create Tournament'}</DialogTitle>
              <DialogDescription>
                Fill in the tournament details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., IPL 2024"
                  required
                  data-testid="tournament-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => setFormData({ ...formData, format: value })}
                  >
                    <SelectTrigger data-testid="tournament-format-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T20">T20</SelectItem>
                      <SelectItem value="ODI">ODI</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                    data-testid="tournament-year-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    data-testid="tournament-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    data-testid="tournament-end-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teams">Teams (comma-separated)</Label>
                <Textarea
                  id="teams"
                  value={formData.teams}
                  onChange={(e) => setFormData({ ...formData, teams: e.target.value })}
                  placeholder="e.g., Mumbai Indians, Chennai Super Kings, Royal Challengers"
                  required
                  data-testid="tournament-teams-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="tournament-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={saving} className="rounded-full" data-testid="save-tournament-btn">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingTournament ? 'Update' : 'Create'} Tournament
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No tournaments yet</p>
            <p className="text-sm text-muted-foreground">Create your first tournament to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((t) => (
                <TableRow key={t.id} data-testid={`tournament-row-${t.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      {t.active_flag && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">Active</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{t.format}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.teams?.length || 0} teams
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!t.active_flag && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetActive(t.id)}
                          data-testid={`set-active-${t.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(t)}
                        data-testid={`edit-tournament-${t.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(t.id)}
                        data-testid={`delete-tournament-${t.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
};

// Matches Tab Component
const MatchesTab = ({ selectedTournament, refreshStats }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [matchMode, setMatchMode] = useState('manual');
  const [formData, setFormData] = useState({
    match_no: 1,
    stage: 'Group',
    team_a: '',
    team_b: '',
    venue: '',
    start_datetime_ist: ''
  });

  const fetchMatches = useCallback(async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const res = await matchApi.getAll(selectedTournament.id);
      setMatches(res.data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTournament]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleSync = async () => {
    if (!selectedTournament) return;
    setSyncing(true);
    try {
      const res = await matchApi.sync(selectedTournament.id);
      toast.success(res.data.message);
      await fetchMatches();
      await refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      match_no: matches.length + 1,
      stage: 'Group',
      team_a: '',
      team_b: '',
      venue: '',
      start_datetime_ist: ''
    });
    setEditingMatch(null);
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    setFormData({
      match_no: match.match_no,
      stage: match.stage,
      team_a: match.team_a,
      team_b: match.team_b,
      venue: match.venue,
      start_datetime_ist: match.start_datetime_ist.slice(0, 16)
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingMatch) {
        await matchApi.update(editingMatch.id, formData);
        toast.success('Match updated');
      } else {
        await matchApi.create({
          ...formData,
          tournament_id: selectedTournament.id
        });
        toast.success('Match created');
      }

      await fetchMatches();
      await refreshStats();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSetResult = async (matchId, winner) => {
    try {
      await matchApi.update(matchId, { result_winner: winner });
      toast.success('Result saved');
      await fetchMatches();
      await refreshStats();
    } catch (err) {
      toast.error('Failed to save result');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this match? Related predictions will also be deleted.')) return;
    try {
      await matchApi.delete(id);
      await fetchMatches();
      await refreshStats();
      toast.success('Match deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (!selectedTournament) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">Please select a tournament first</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="matches-tab">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Match Management</CardTitle>
            <CardDescription>{selectedTournament.name}</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <Tabs value={matchMode} onValueChange={setMatchMode} className="w-auto">
              <TabsList>
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="auto">Auto Sync</TabsTrigger>
              </TabsList>
            </Tabs>

            {matchMode === 'auto' ? (
              <Button onClick={handleSync} disabled={syncing} className="rounded-full" data-testid="sync-matches-btn">
                {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Sync Matches
              </Button>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="rounded-full" data-testid="add-match-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Match
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingMatch ? 'Edit Match' : 'Add Match'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Match No.</Label>
                        <Input
                          type="number"
                          value={formData.match_no}
                          onChange={(e) => setFormData({ ...formData, match_no: parseInt(e.target.value) })}
                          required
                          data-testid="match-no-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stage</Label>
                        <Select
                          value={formData.stage}
                          onValueChange={(value) => setFormData({ ...formData, stage: value })}
                        >
                          <SelectTrigger data-testid="match-stage-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Group">Group</SelectItem>
                            <SelectItem value="QF">Quarter Final</SelectItem>
                            <SelectItem value="SF">Semi Final</SelectItem>
                            <SelectItem value="Final">Final</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Team A</Label>
                        <Select
                          value={formData.team_a}
                          onValueChange={(value) => setFormData({ ...formData, team_a: value })}
                        >
                          <SelectTrigger data-testid="team-a-select">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTournament.teams?.map((team) => (
                              <SelectItem key={team} value={team}>{team}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Team B</Label>
                        <Select
                          value={formData.team_b}
                          onValueChange={(value) => setFormData({ ...formData, team_b: value })}
                        >
                          <SelectTrigger data-testid="team-b-select">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTournament.teams?.map((team) => (
                              <SelectItem key={team} value={team}>{team}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Input
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        placeholder="e.g., Wankhede Stadium, Mumbai"
                        required
                        data-testid="venue-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Start Date & Time (IST)</Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_datetime_ist}
                        onChange={(e) => setFormData({ ...formData, start_datetime_ist: e.target.value })}
                        required
                        data-testid="datetime-input"
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={saving} className="rounded-full" data-testid="save-match-btn">
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingMatch ? 'Update' : 'Create'} Match
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No matches scheduled</p>
            <p className="text-sm text-muted-foreground">Add matches manually or use auto sync</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Date/Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id} data-testid={`match-row-${match.id}`}>
                  <TableCell>
                    <Badge variant="outline">{match.match_no}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{match.team_a} vs {match.team_b}</p>
                      <p className="text-xs text-muted-foreground">{match.stage}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {match.venue}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {formatDateIST(match.start_datetime_ist)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {match.status === 'completed' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        Winner: {match.result_winner}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{match.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {match.status !== 'completed' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`set-result-${match.id}`}>
                              <Trophy className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Set Match Result</DialogTitle>
                              <DialogDescription>
                                {match.team_a} vs {match.team_b}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex gap-4 py-4">
                              <Button
                                className="flex-1 rounded-full"
                                onClick={() => handleSetResult(match.id, match.team_a)}
                              >
                                {match.team_a} Won
                              </Button>
                              <Button
                                className="flex-1 rounded-full"
                                variant="outline"
                                onClick={() => handleSetResult(match.id, match.team_b)}
                              >
                                {match.team_b} Won
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(match)}
                        data-testid={`edit-match-${match.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(match.id)}
                        data-testid={`delete-match-${match.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
};

// Nominations Tab Component
const NominationsTab = ({ refreshStats }) => {
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: ''
  });

  const fetchNominations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await nominationApi.getAll();
      setNominations(res.data);
    } catch (err) {
      console.error('Failed to fetch nominations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNominations();
  }, [fetchNominations]);

  const resetForm = () => {
    setFormData({ full_name: '', username: '', email: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await nominationApi.create(formData);
      toast.success('Nomination added! Invite email sent.');
      await fetchNominations();
      await refreshStats();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add nomination');
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async (id) => {
    try {
      await nominationApi.resendInvite(id);
      toast.success('Invite resent!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resend');
    }
  };

  return (
    <Card data-testid="nominations-tab">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Nominations</CardTitle>
          <CardDescription>Manage user invitations</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-full" data-testid="add-nomination-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nominate User</DialogTitle>
              <DialogDescription>
                Add a new user to the prediction league. They'll receive an invite email.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                  data-testid="nomination-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="johndoe"
                  required
                  data-testid="nomination-username-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                  data-testid="nomination-email-input"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving} className="rounded-full" data-testid="save-nomination-btn">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Invite
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : nominations.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No nominations yet</p>
            <p className="text-sm text-muted-foreground">Add users to invite them to the league</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nominations.map((nom) => (
                <TableRow key={nom.id} data-testid={`nomination-row-${nom.id}`}>
                  <TableCell className="font-medium">{nom.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">@{nom.username}</TableCell>
                  <TableCell className="text-muted-foreground">{nom.email}</TableCell>
                  <TableCell>
                    {nom.status === 'registered' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Registered
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">
                        <Mail className="w-3 h-3 mr-1" />
                        Invited
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {nom.status === 'invited' && nom.invite_token && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = `${window.location.origin}/signup?token=${nom.invite_token}`;
                            navigator.clipboard.writeText(link);
                            toast.success('Invite link copied!');
                          }}
                          data-testid={`copy-invite-${nom.id}`}
                        >
                          <Link2 className="w-4 h-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResend(nom.id)}
                          data-testid={`resend-invite-${nom.id}`}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Resend
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
