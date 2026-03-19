import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchApi, predictionApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { formatDateIST, getRankStyle, getInitials } from '../../lib/utils';
import { ArrowLeft, Check, X, Trophy, MapPin, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MatchDetails = () => {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [matchRes, predictionsRes] = await Promise.all([
        matchApi.getById(matchId),
        predictionApi.getForMatch(matchId)
      ]);
      setMatch(matchRes.data);
      setPredictions(predictionsRes.data);
    } catch (err) {
      console.error('Failed to fetch match details:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 rounded-2xl mb-6" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="font-heading text-xl font-bold mb-2">Match Not Found</h2>
            <p className="text-muted-foreground mb-4">The match you're looking for doesn't exist.</p>
            <Link to="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const correctPredictions = predictions.filter(p => p.is_correct).length;
  const accuracy = predictions.length > 0 ? Math.round((correctPredictions / predictions.length) * 100) : 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8" data-testid="match-details">
      {/* Back Button */}
      <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      {/* Match Info Card */}
      <Card className="mb-6" data-testid="match-info-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-slate-100 text-slate-700 border-0">Match {match.match_no}</Badge>
                <Badge className={cn(
                  'border-0',
                  match.stage === 'Final' && 'bg-yellow-100 text-yellow-700',
                  match.stage === 'SF' && 'bg-orange-100 text-orange-700',
                  match.stage === 'QF' && 'bg-purple-100 text-purple-700',
                  match.stage === 'Group' && 'bg-slate-100 text-slate-700'
                )}>
                  {match.stage}
                </Badge>
                <Badge className="bg-slate-100 text-slate-600 border-0">Completed</Badge>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-center gap-8 py-6">
            <div className={cn(
              'text-center p-4 rounded-xl flex-1',
              match.result_winner === match.team_a && 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500'
            )}>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">{match.team_a}</h2>
              {match.result_winner === match.team_a && (
                <div className="flex items-center justify-center gap-1 mt-2 text-emerald-600">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">Winner</span>
                </div>
              )}
            </div>

            <span className="text-2xl font-bold text-muted-foreground">VS</span>

            <div className={cn(
              'text-center p-4 rounded-xl flex-1',
              match.result_winner === match.team_b && 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500'
            )}>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">{match.team_b}</h2>
              {match.result_winner === match.team_b && (
                <div className="flex items-center justify-center gap-1 mt-2 text-emerald-600">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">Winner</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{match.venue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{formatDateIST(match.start_datetime_ist)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictions Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{predictions.length}</p>
            <p className="text-sm text-muted-foreground">Total Predictions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{correctPredictions}</p>
            <p className="text-sm text-muted-foreground">Correct</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{accuracy}%</p>
            <p className="text-sm text-muted-foreground">Accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Predictions Table */}
      <Card data-testid="predictions-table">
        <CardHeader>
          <CardTitle className="font-heading">All Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">No predictions were made for this match</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Prediction</TableHead>
                  <TableHead className="text-right">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.map((pred) => (
                  <TableRow 
                    key={pred.id}
                    className={cn(
                      pred.user_id === user?.id && 'bg-primary/5'
                    )}
                    data-testid={`prediction-row-${pred.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {getInitials(pred.user_full_name)}
                        </div>
                        <div>
                          <p className="font-medium">{pred.user_full_name}</p>
                          <p className="text-xs text-muted-foreground">@{pred.user_username}</p>
                        </div>
                        {pred.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{pred.predicted_winner}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {pred.is_correct ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                          <Check className="w-3 h-3 mr-1" />
                          Correct
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-0">
                          <X className="w-3 h-3 mr-1" />
                          Wrong
                        </Badge>
                      )}
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

export default MatchDetails;
