import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TournamentContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const TournamentProvider = ({ children }) => {
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tournaments`);
      setTournaments(response.data);
      
      // Set active tournament
      const active = response.data.find(t => t.active_flag);
      setActiveTournament(active || null);
      
      // Set selected tournament to active by default
      if (!selectedTournament && active) {
        setSelectedTournament(active);
      }
    } catch (err) {
      console.error('Failed to fetch tournaments:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTournament]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const selectTournament = (tournament) => {
    setSelectedTournament(tournament);
  };

  const value = {
    tournaments,
    activeTournament,
    selectedTournament,
    loading,
    selectTournament,
    refreshTournaments: fetchTournaments
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
