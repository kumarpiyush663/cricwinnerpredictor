import { useState, useEffect, useCallback } from 'react';
import { useTournament } from '../../contexts/TournamentContext';
import { useAuth } from '../../contexts/AuthContext';
import { leaderboardApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
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
  TableRow 
} from '../ui/table';
import { getRankStyle, getInitials, cn } from '../../lib/utils';
import { Trophy, Medal, Target, AlertCircle } from 'lucide-react';

export const Leaderboard = () => {
  const { user } = useAuth();
  const { selectedTournament } = useTournament();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');

  const fetchLeaderboard = useCallback(async () => {
    if (!selectedTournament) return;
    
    setLoading(true);
    try {
      const res = await leaderboardApi.get(selectedTournament.id, stageFilter);
      setLeaderboard(res.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTournament, stageFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const currentUserRank = leaderboard.find(e => e.user_id === user?.id);

  if (!selectedTournament) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center py-12" data-testid="no-tournament">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="font-heading text-xl font-bold mb-2">No Tournament Selected</h2>
            <p className="text-muted-foreground">
              Please select a tournament from the dropdown above
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8" data-testid="leaderboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">{selectedTournament.name}</p>
        </div>
        
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]" data-testid="stage-filter">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Matches</SelectItem>
            <SelectItem value="Group">Group Stage</SelectItem>
            <SelectItem value="QF">Quarter Finals</SelectItem>
            <SelectItem value="SF">Semi Finals</SelectItem>
            <SelectItem value="Final">Final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current User Position */}
      {currentUserRank && (
        <Card className="mb-6 bg-primary/5 border-primary/20" data-testid="user-rank-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg',
                  getRankStyle(currentUserRank.rank)
                )}>
                  {currentUserRank.rank}
                </div>
                <div>
                  <p className="font-heading font-bold">Your Position</p>
                  <p className="text-sm text-muted-foreground">
                    {currentUserRank.correct_predictions} correct out of {currentUserRank.total_predictions}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{currentUserRank.accuracy}%</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium (for non-loading state with enough users) */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8" data-testid="top-3-podium">
          {/* Second Place */}
          <Card className="text-center order-1 md:translate-y-4">
            <CardContent className="p-4">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                <Medal className="w-8 h-8 text-white" />
              </div>
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-slate-900 font-bold">
                2
              </div>
              <p className="font-heading font-bold truncate">{leaderboard[1].full_name}</p>
              <p className="text-xs text-muted-foreground mb-1">@{leaderboard[1].username}</p>
              <p className="text-lg font-bold text-primary">{leaderboard[1].correct_predictions}</p>
              <p className="text-xs text-muted-foreground">correct</p>
            </CardContent>
          </Card>

          {/* First Place */}
          <Card className="text-center order-2 ring-2 ring-yellow-400/50 bg-yellow-50/50 dark:bg-yellow-900/10">
            <CardContent className="p-4">
              <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-slate-900 font-bold text-lg">
                1
              </div>
              <p className="font-heading font-bold text-lg truncate">{leaderboard[0].full_name}</p>
              <p className="text-xs text-muted-foreground mb-1">@{leaderboard[0].username}</p>
              <p className="text-2xl font-bold text-primary">{leaderboard[0].correct_predictions}</p>
              <p className="text-xs text-muted-foreground">correct</p>
            </CardContent>
          </Card>

          {/* Third Place */}
          <Card className="text-center order-3 md:translate-y-8">
            <CardContent className="p-4">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Medal className="w-7 h-7 text-white" />
              </div>
              <div className="w-7 h-7 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-sm">
                3
              </div>
              <p className="font-heading font-bold truncate">{leaderboard[2].full_name}</p>
              <p className="text-xs text-muted-foreground mb-1">@{leaderboard[2].username}</p>
              <p className="text-lg font-bold text-primary">{leaderboard[2].correct_predictions}</p>
              <p className="text-xs text-muted-foreground">correct</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <Card data-testid="leaderboard-table">
        <CardHeader>
          <CardTitle className="font-heading">Full Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-heading text-lg font-bold mb-2">No Rankings Yet</h3>
              <p className="text-muted-foreground text-sm">
                Rankings will appear once match results are entered
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-center">Correct</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow 
                    key={entry.user_id}
                    className={cn(
                      entry.user_id === user?.id && 'bg-primary/5 border-l-2 border-primary'
                    )}
                    data-testid={`leaderboard-row-${entry.rank}`}
                  >
                    <TableCell>
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                        getRankStyle(entry.rank)
                      )}>
                        {entry.rank}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium">
                          {getInitials(entry.full_name)}
                        </div>
                        <div>
                          <p className="font-medium">{entry.full_name}</p>
                          <p className="text-xs text-muted-foreground">@{entry.username}</p>
                        </div>
                        {entry.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-emerald-600">
                      {entry.correct_predictions}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {entry.total_predictions}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="font-bold">
                        {entry.accuracy}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
