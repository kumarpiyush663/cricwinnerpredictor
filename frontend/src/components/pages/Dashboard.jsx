import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTournament } from '../../contexts/TournamentContext';
import { matchApi, predictionApi } from '../../lib/api';
import { MatchCard } from '../matches/MatchCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Trophy, Target, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { user } = useAuth();
  const { selectedTournament } = useTournament();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = useCallback(async () => {
    if (!selectedTournament) return;
    
    setLoading(true);
    try {
      const [matchesRes, predictionsRes] = await Promise.all([
        matchApi.getAll(selectedTournament.id),
        predictionApi.getMy(selectedTournament.id)
      ]);

      setMatches(matchesRes.data);
      
      // Convert predictions array to object keyed by match_id
      const predMap = {};
      predictionsRes.data.forEach(p => {
        predMap[p.match_id] = p;
      });
      setPredictions(predMap);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [selectedTournament]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePredictionSubmit = async (matchId, team) => {
    try {
      const res = await predictionApi.submit({ match_id: matchId, predicted_winner: team });
      setPredictions(prev => ({
        ...prev,
        [matchId]: res.data
      }));
      toast.success('Prediction saved!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save prediction');
    }
  };

  const filterMatches = (status) => {
    if (status === 'all') return matches;
    if (status === 'upcoming') return matches.filter(m => m.status === 'upcoming' && new Date(m.start_datetime_ist) > new Date());
    if (status === 'live') return matches.filter(m => m.status === 'live' || (m.status === 'upcoming' && new Date(m.start_datetime_ist) <= new Date()));
    if (status === 'completed') return matches.filter(m => m.status === 'completed');
    return matches;
  };

  const stats = {
    total: matches.length,
    upcoming: matches.filter(m => m.status === 'upcoming' && new Date(m.start_datetime_ist) > new Date()).length,
    completed: matches.filter(m => m.status === 'completed').length,
    predicted: Object.keys(predictions).length,
    correct: Object.values(predictions).filter(p => p.is_correct === true).length
  };

  if (!selectedTournament) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center py-12" data-testid="no-tournament">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="font-heading text-xl font-bold mb-2">No Tournament Selected</h2>
            <p className="text-muted-foreground">
              Please select a tournament from the dropdown above to view matches
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">
          Welcome back, {user?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          {selectedTournament.name} • {selectedTournament.format}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="hover-lift" data-testid="stat-total-matches">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift" data-testid="stat-upcoming">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift" data-testid="stat-predicted">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.predicted}</p>
                <p className="text-xs text-muted-foreground">Predicted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift" data-testid="stat-correct">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.correct}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches Section */}
      <Card data-testid="matches-section">
        <CardHeader className="pb-0">
          <CardTitle className="font-heading text-2xl">Matches</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6" data-testid="match-tabs">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({stats.upcoming})</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-2xl" />
                  ))}
                </div>
              ) : filterMatches(activeTab).length === 0 ? (
                <div className="text-center py-12" data-testid="no-matches">
                  <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="font-heading text-lg font-bold mb-2">No matches found</h3>
                  <p className="text-muted-foreground text-sm">
                    {activeTab === 'all' 
                      ? 'No matches have been scheduled yet'
                      : `No ${activeTab} matches at the moment`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterMatches(activeTab).map((match, idx) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predictions[match.id]}
                      onPredict={handlePredictionSubmit}
                      className={`animate-fade-in-up animate-delay-${(idx % 6) * 100}`}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
