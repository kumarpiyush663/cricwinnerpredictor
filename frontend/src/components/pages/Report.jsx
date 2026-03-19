import { useState, useEffect, useCallback, useRef } from 'react';
import { useTournament } from '../../contexts/TournamentContext';
import { useAuth } from '../../contexts/AuthContext';
import { reportApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { getRankStyle, getInitials, formatDate, cn } from '../../lib/utils';
import { 
  Trophy, 
  Target, 
  AlertCircle, 
  Users, 
  BarChart3, 
  Award,
  Download,
  Loader2,
  Lock
} from 'lucide-react';

export const Report = () => {
  const { user, isAdmin } = useAuth();
  const { selectedTournament } = useTournament();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef(null);

  const fetchReport = useCallback(async () => {
    if (!selectedTournament) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await reportApi.get(selectedTournament.id);
      setReport(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Report not yet published. Please wait for the admin to finalize the tournament.');
      } else {
        setError('Failed to load report');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTournament]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportToPdf = async () => {
    setExportingPdf(true);
    try {
      // Create a simple PDF using the print functionality
      const printContent = reportRef.current;
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Tournament Report - ${selectedTournament?.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #059669; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; }
              .winner { background-color: #fef3c7; }
              .stat-card { display: inline-block; padding: 15px; margin: 10px; border: 1px solid #ddd; border-radius: 8px; }
            </style>
          </head>
          <body>
            <h1>🏆 ${selectedTournament?.name} - Tournament Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            
            <h2>🥇 Winners</h2>
            ${report?.winners?.map(w => `<p><strong>${w.full_name}</strong> (@${w.username}) - ${w.correct_predictions} correct predictions</p>`).join('') || 'N/A'}
            
            <h2>📊 Statistics</h2>
            <div class="stat-card">
              <strong>Total Matches:</strong> ${report?.total_matches || 0}
            </div>
            <div class="stat-card">
              <strong>Completed:</strong> ${report?.completed_matches || 0}
            </div>
            <div class="stat-card">
              <strong>Total Predictions:</strong> ${report?.total_predictions || 0}
            </div>
            
            <h2>Most Predicted Team</h2>
            <p>${report?.most_predicted_team?.team || 'N/A'} (${report?.most_predicted_team?.count || 0} predictions)</p>
            
            <h2>Toughest Match</h2>
            <p>${report?.toughest_match?.match?.team_a || 'N/A'} vs ${report?.toughest_match?.match?.team_b || ''} - ${report?.toughest_match?.accuracy?.toFixed(1) || 0}% accuracy</p>
            
            <h2>Full Leaderboard</h2>
            <table>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Username</th>
                <th>Correct</th>
                <th>Total</th>
                <th>Accuracy</th>
              </tr>
              ${report?.leaderboard?.map(e => `
                <tr ${e.user_id === user?.id ? 'class="winner"' : ''}>
                  <td>${e.rank}</td>
                  <td>${e.full_name}</td>
                  <td>@${e.username}</td>
                  <td>${e.correct_predictions}</td>
                  <td>${e.total_predictions}</td>
                  <td>${e.accuracy}%</td>
                </tr>
              `).join('') || ''}
            </table>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  if (!selectedTournament) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center py-12">
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

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-48 rounded-2xl mb-6" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center py-12" data-testid="report-error">
          <CardContent>
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="font-heading text-xl font-bold mb-2">Report Not Available</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8" data-testid="report-page" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Tournament Report</h1>
          <p className="text-muted-foreground">{selectedTournament.name}</p>
        </div>
        
        <Button 
          onClick={exportToPdf} 
          disabled={exportingPdf}
          className="rounded-full"
          data-testid="export-pdf-btn"
        >
          {exportingPdf ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export PDF
        </Button>
      </div>

      {/* Winners Section */}
      {report?.winners?.length > 0 && (
        <Card className="mb-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200" data-testid="winners-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold">Champion{report.winners.length > 1 ? 's' : ''}</h2>
                <p className="text-sm text-muted-foreground">
                  {report.winners.length > 1 ? 'Tied for first place' : 'Tournament Winner'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.winners.map((winner, idx) => (
                <div 
                  key={winner.user_id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-xl font-bold text-white">
                    {getInitials(winner.full_name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-bold text-lg">{winner.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{winner.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600">{winner.correct_predictions}</p>
                    <p className="text-xs text-muted-foreground">correct</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card data-testid="stat-total-matches">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{report?.total_matches || 0}</p>
            <p className="text-xs text-muted-foreground">Total Matches</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-completed">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">{report?.completed_matches || 0}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-predictions">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{report?.total_predictions || 0}</p>
            <p className="text-xs text-muted-foreground">Predictions</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-participants">
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{report?.leaderboard?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Participants</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Most Predicted Team */}
        <Card data-testid="most-predicted-team">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Predicted Team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold">{report?.most_predicted_team?.team || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">
              {report?.most_predicted_team?.count || 0} predictions across all matches
            </p>
          </CardContent>
        </Card>

        {/* Toughest Match */}
        <Card data-testid="toughest-match">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toughest Match</CardTitle>
          </CardHeader>
          <CardContent>
            {report?.toughest_match ? (
              <>
                <p className="font-heading text-xl font-bold">
                  {report.toughest_match.match?.team_a} vs {report.toughest_match.match?.team_b}
                </p>
                <p className="text-sm text-muted-foreground">
                  Only {report.toughest_match.accuracy?.toFixed(1)}% prediction accuracy
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Leaderboard */}
      <Card data-testid="report-leaderboard">
        <CardHeader>
          <CardTitle className="font-heading">Final Standings</CardTitle>
        </CardHeader>
        <CardContent>
          {report?.leaderboard?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">No participants in this tournament</p>
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
                {report?.leaderboard?.map((entry) => (
                  <TableRow 
                    key={entry.user_id}
                    className={cn(
                      entry.user_id === user?.id && 'bg-primary/5 border-l-2 border-primary',
                      entry.rank <= 3 && 'font-medium'
                    )}
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

      {/* Generation Info */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        Report generated on {formatDate(report?.generated_at)}
      </p>
    </div>
  );
};

export default Report;
