import { useState, useEffect, useCallback } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Student, Match } from '../types/student';
import { toast } from 'sonner@2.0.3';

export interface UseSupabaseDataReturn {
  students: Student[];
  matches: Match[];
  stats: {
    studentsCount: number;
    pendingMatches: number;
    completedMatches: number;
  };
  loading: boolean;
  addStudent: (student: Student) => Promise<void>;
  updateMatchStatus: (matchId: string, status: 'accepted' | 'declined') => Promise<void>;
  addMatches: (matches: Match[]) => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useSupabaseData = (): UseSupabaseDataReturn => {
  const [students, setStudents] = useState<Student[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState({
    studentsCount: 0,
    pendingMatches: 0,
    completedMatches: 0
  });
  const [loading, setLoading] = useState(true);

  // Rafraîchir toutes les données
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsData, matchesData, statsData] = await Promise.all([
        SupabaseService.getStudents(),
        SupabaseService.getMatches(),
        SupabaseService.getStats()
      ]);

      setStudents(studentsData);
      setMatches(matchesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  // Ajouter un étudiant
  const addStudent = useCallback(async (student: Student) => {
    try {
      await SupabaseService.addStudent(student);
      await refreshData(); // Rafraîchir pour récupérer les dernières données
      toast.success('Inscription enregistrée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'étudiant:', error);
      toast.error('Erreur lors de l\'inscription');
      throw error;
    }
  }, [refreshData]);

  // Mettre à jour le statut d'un match
  const updateMatchStatus = useCallback(async (matchId: string, status: 'accepted' | 'declined') => {
    try {
      await SupabaseService.updateMatchStatus(matchId, status);
      await refreshData();
      
      if (status === 'accepted') {
        toast.success('Échange accepté !');
      } else {
        toast.error('Échange refusé');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du match:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  }, [refreshData]);

  // Ajouter de nouveaux matchs
  const addMatches = useCallback(async (newMatches: Match[]) => {
    try {
      await SupabaseService.addMatches(newMatches);
      await refreshData();
      
      const addedMatches = newMatches.length;
      if (addedMatches > 0) {
        toast.success(`${addedMatches} nouvelle(s) correspondance(s) trouvée(s) !`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout des matchs:', error);
      toast.error('Erreur lors de la création des matchs');
      throw error;
    }
  }, [refreshData]);

  // Effacer toutes les données
  const clearAllData = useCallback(async () => {
    try {
      await SupabaseService.clearAllData();
      await refreshData();
      toast.success('Données effacées');
    } catch (error) {
      console.error('Erreur lors de l\'effacement:', error);
      toast.error('Erreur lors de l\'effacement des données');
      throw error;
    }
  }, [refreshData]);

  // Charger les données au démarrage
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Polling pour rafraîchir les données périodiquement (simulation temps réel)
  useEffect(() => {
    const interval = setInterval(refreshData, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    students,
    matches,
    stats,
    loading,
    addStudent,
    updateMatchStatus,
    addMatches,
    clearAllData,
    refreshData
  };
};