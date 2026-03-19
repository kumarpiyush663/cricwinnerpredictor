import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  formatDateIST, 
  formatTime, 
  getMatchStatus, 
  getTimeUntilMatch,
  isCutoffPassed 
} from '../../lib/utils';
import { MapPin, Calendar, Lock, Check, X, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MatchCard = ({ match, prediction, onPredict, className }) => {
  const [selectedTeam, setSelectedTeam] = useState(prediction?.predicted_winner || null);
  const [saving, setSaving] = useState(false);
  
  const status = getMatchStatus(match);
  const cutoffPassed = isCutoffPassed(match.start_datetime_ist);
  const timeUntil = getTimeUntilMatch(match.start_datetime_ist);
  const canPredict = !cutoffPassed && status === 'upcoming';

  const handleTeamSelect = async (team) => {
    if (!canPredict || saving) return;
    
    setSelectedTeam(team);
    setSaving(true);
    await onPredict(match.id, team);
    setSaving(false);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse" />
            Live
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
            {timeUntil || 'Upcoming'}
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStageBadge = () => {
    const stageColors = {
      'Group': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      'QF': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'SF': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      'Final': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return (
      <Badge className={cn('border-0', stageColors[match.stage] || stageColors['Group'])}>
        {match.stage}
      </Badge>
    );
  };

  return (
    <Card 
      className={cn(
        'match-card overflow-hidden border hover:shadow-lg transition-all',
        status === 'live' && 'ring-2 ring-red-500/20',
        className
      )}
      data-testid={`match-card-${match.id}`}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Match {match.match_no}
            </span>
            {getStageBadge()}
          </div>
          {getStatusBadge()}
        </div>

        {/* Teams */}
        <div className="p-4 space-y-3">
          {/* Team A */}
          <button
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-xl transition-all',
              canPredict && 'hover:bg-primary/5 cursor-pointer',
              !canPredict && 'cursor-default',
              selectedTeam === match.team_a && 'bg-primary/10 ring-2 ring-primary'
            )}
            onClick={() => handleTeamSelect(match.team_a)}
            disabled={!canPredict || saving}
            data-testid={`select-team-a-${match.id}`}
          >
            <span className="font-heading font-bold text-lg">{match.team_a}</span>
            {selectedTeam === match.team_a && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            {status === 'completed' && match.result_winner === match.team_a && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0">Winner</Badge>
            )}
          </button>

          <div className="text-center text-sm text-muted-foreground font-medium">VS</div>

          {/* Team B */}
          <button
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-xl transition-all',
              canPredict && 'hover:bg-primary/5 cursor-pointer',
              !canPredict && 'cursor-default',
              selectedTeam === match.team_b && 'bg-primary/10 ring-2 ring-primary'
            )}
            onClick={() => handleTeamSelect(match.team_b)}
            disabled={!canPredict || saving}
            data-testid={`select-team-b-${match.id}`}
          >
            <span className="font-heading font-bold text-lg">{match.team_b}</span>
            {selectedTeam === match.team_b && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            {status === 'completed' && match.result_winner === match.team_b && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0">Winner</Badge>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 space-y-3">
          {/* Venue & Time */}
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{match.venue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateIST(match.start_datetime_ist)}</span>
            </div>
          </div>

          {/* Prediction Status */}
          {prediction && (
            <div className={cn(
              'flex items-center justify-between p-2 rounded-lg text-sm',
              cutoffPassed ? 'bg-muted' : 'bg-primary/5'
            )}>
              <div className="flex items-center gap-2">
                {cutoffPassed ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Check className="w-4 h-4 text-primary" />
                )}
                <span>
                  Your pick: <strong>{prediction.predicted_winner}</strong>
                </span>
              </div>
              {status === 'completed' && (
                prediction.is_correct ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    <Check className="w-3 h-3 mr-1" />
                    Correct
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border-0">
                    <X className="w-3 h-3 mr-1" />
                    Wrong
                  </Badge>
                )
              )}
            </div>
          )}

          {/* View Predictions (for completed matches) */}
          {status === 'completed' && (
            <Link to={`/match/${match.id}`}>
              <Button 
                variant="outline" 
                className="w-full rounded-full"
                data-testid={`view-predictions-${match.id}`}
              >
                View All Predictions
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}

          {/* Cutoff notice */}
          {!prediction && canPredict && (
            <p className="text-xs text-center text-muted-foreground">
              Click a team to make your prediction
            </p>
          )}

          {!prediction && cutoffPassed && status !== 'completed' && (
            <p className="text-xs text-center text-amber-600">
              Prediction window closed
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
