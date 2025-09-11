import { useState, useEffect, useCallback, useRef } from 'react';
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
  error: string | null;
  lastSync: Date | null;
  addStudent: (student: Student) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Rafraîchir toutes les données
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier d'abord la santé du serveur
      const isServerHealthy = await SupabaseService.checkHealth();
      if (!isServerHealthy) {
        throw new Error('Le serveur Supabase n\'est pas accessible. Vérifiez votre connexion internet.');
      }

      // Récupérer les données avec gestion d'erreur individuelle
      const [studentsData, matchesData, statsData] = await Promise.allSettled([
        SupabaseService.getStudents(),
        SupabaseService.getMatches(),
        SupabaseService.getStats()
      ]);

      // Traiter les résultats
      if (studentsData.status === 'fulfilled') {
        setStudents(studentsData.value);
      } else {
        console.warn('Erreur lors de la récupération des étudiants:', studentsData.reason);
      }

      if (matchesData.status === 'fulfilled') {
        setMatches(matchesData.value);
      } else {
        console.warn('Erreur lors de la récupération des matchs:', matchesData.reason);
      }

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      } else {
        console.warn('Erreur lors de la récupération des statistiques:', statsData.reason);
        // Calculer les stats localement en cas d'échec
        setStats({
          studentsCount: students.length,
          pendingMatches: matches.filter(m => m.statut === 'pending').length,
          completedMatches: matches.filter(m => m.statut !== 'pending').length
        });
      }

      setLastSync(new Date());
      
      // Si au moins une requête a réussi, considérer que c'est un succès partiel
      const successCount = [studentsData, matchesData, statsData].filter(r => r.status === 'fulfilled').length;
      if (successCount === 0) {
        throw new Error('Aucune donnée n\'a pu être récupérée');
      }
      
    } catch (error) {
      let errorMessage = 'Erreur de connexion inconnue';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Messages plus spécifiques selon le type d'erreur
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
        } else if (error.message.includes('Timeout')) {
          errorMessage = 'Le serveur met trop de temps à répondre. Réessayez dans quelques instants.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Erreur du serveur. Veuillez réessayer dans quelques instants.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Service non trouvé. Le serveur est peut-être en maintenance.';
        } else if (error.message.includes('Pas de connexion internet')) {
          errorMessage = 'Pas de connexion internet. Vérifiez votre réseau.';
        }
      }
      
      console.error('Erreur lors du rafraîchissement des données:', error);
      setError(errorMessage);
      
      // Ne pas afficher de toast d'erreur pour le premier chargement
      if (!loading) {
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, students, matches]);

  // Ajouter un étudiant
  const addStudent = useCallback(async (student: Student) => {
    try {
      setError(null);
      await SupabaseService.addStudent(student);
      await refreshData(); // Rafraîchir pour récupérer les dernières données
      toast.success('Inscription enregistrée avec succès !');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
      console.error('Erreur lors de l\'ajout de l\'étudiant:', error);
      setError(errorMessage);
      toast.error('Erreur lors de l\'inscription');
      throw error;
    }
  }, [refreshData]);

  // Supprimer un étudiant
  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      setError(null);
      await SupabaseService.deleteStudent(studentId);
      await refreshData(); // Rafraîchir pour récupérer les dernières données
      toast.success('Votre demande a été supprimée');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      console.error('Erreur lors de la suppression de l\'étudiant:', error);
      setError(errorMessage);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  }, [refreshData]);

  // Mettre à jour le statut d'un match
  const updateMatchStatus = useCallback(async (matchId: string, status: 'accepted' | 'declined') => {
    try {
      setError(null);
      await SupabaseService.updateMatchStatus(matchId, status);
      await refreshData();
      
      if (status === 'accepted') {
        toast.success('Échange accepté !');
      } else {
        toast.error('Échange refusé');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      console.error('Erreur lors de la mise à jour du match:', error);
      setError(errorMessage);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  }, [refreshData]);

  // Ajouter de nouveaux matchs
  const addMatches = useCallback(async (newMatches: Match[]) => {
    try {
      setError(null);
      const addedCount = await SupabaseService.addMatches(newMatches);
      
      if (addedCount > 0) {
        await refreshData();
        toast.success(`${addedCount} nouvelle(s) correspondance(s) trouvée(s) !`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création des matchs';
      console.error('Erreur lors de l\'ajout des matchs:', error);
      setError(errorMessage);
      // Ne pas afficher de toast pour cette erreur car elle peut être fréquente
    }
  }, [refreshData]);

  // Effacer toutes les données
  const clearAllData = useCallback(async () => {
    try {
      setError(null);
      await SupabaseService.clearAllData();
      await refreshData();
      toast.success('Données effacées');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'effacement des données';
      console.error('Erreur lors de l\'effacement:', error);
      setError(errorMessage);
      toast.error('Erreur lors de l\'effacement des données');
      throw error;
    }
  }, [refreshData]);

  // Charger les données au démarrage
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Polling intelligent pour rafraîchir les données périodiquement
  useEffect(() => {
    let failureCount = 0;
    
    const scheduleNextRefresh = () => {
      // Arrêter le précédent timeout s'il existe
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Ajuster l'intervalle en fonction des échecs
      let interval = 10000; // 10 secondes par défaut
      if (failureCount > 0) {
        interval = Math.min(60000, 10000 * Math.pow(2, failureCount)); // Backoff exponentiel, max 1 minute
      }

      // Programmer le prochain rafraîchissement
      refreshTimeoutRef.current = setTimeout(() => {
        refreshData()
          .then(() => {
            failureCount = 0; // Reset en cas de succès
          })
          .catch(() => {
            failureCount = Math.min(failureCount + 1, 4); // Max 4 échecs
          })
          .finally(() => {
            scheduleNextRefresh(); // Programmer le suivant après completion
          });
      }, interval);
    };

    // Démarrer le polling seulement si on a chargé les données au moins une fois
    if (!loading) {
      scheduleNextRefresh();
    }

    // Cleanup
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [loading, refreshData]);

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    students,
    matches,
    stats,
    loading,
    error,
    lastSync,
    addStudent,
    deleteStudent,
    updateMatchStatus,
    addMatches,
    clearAllData,
    refreshData
  };
};