import * as kv from '../utils/supabase/kv_store';
import { Student, Match } from '../types/student';

// Clés pour le stockage KV
const STUDENTS_KEY = 'td-exchange-students';
const MATCHES_KEY = 'td-exchange-matches';

export interface StoredData {
  students: Student[];
  matches: Match[];
}

export class SupabaseService {
  // Récupérer tous les étudiants
  static async getStudents(): Promise<Student[]> {
    try {
      const data = await kv.get<Student[]>(STUDENTS_KEY);
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      return [];
    }
  }

  // Ajouter un étudiant
  static async addStudent(student: Student): Promise<void> {
    try {
      const currentStudents = await this.getStudents();
      const updatedStudents = [...currentStudents, student];
      await kv.set(STUDENTS_KEY, updatedStudents);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'étudiant:', error);
      throw error;
    }
  }

  // Récupérer tous les matchs
  static async getMatches(): Promise<Match[]> {
    try {
      const data = await kv.get<Match[]>(MATCHES_KEY);
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des matchs:', error);
      return [];
    }
  }

  // Mettre à jour les matchs
  static async updateMatches(matches: Match[]): Promise<void> {
    try {
      await kv.set(MATCHES_KEY, matches);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des matchs:', error);
      throw error;
    }
  }

  // Ajouter de nouveaux matchs
  static async addMatches(newMatches: Match[]): Promise<void> {
    try {
      const currentMatches = await this.getMatches();
      const existingMatchIds = currentMatches.map(m => m.id);
      const freshMatches = newMatches.filter(match => !existingMatchIds.includes(match.id));
      
      if (freshMatches.length > 0) {
        const updatedMatches = [...currentMatches, ...freshMatches];
        await this.updateMatches(updatedMatches);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout des matchs:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'un match
  static async updateMatchStatus(matchId: string, status: 'accepted' | 'declined'): Promise<void> {
    try {
      const currentMatches = await this.getMatches();
      const updatedMatches = currentMatches.map(match => 
        match.id === matchId ? { ...match, statut: status } : match
      );
      await this.updateMatches(updatedMatches);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du match:', error);
      throw error;
    }
  }

  // Effacer toutes les données
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        kv.set(STUDENTS_KEY, []),
        kv.set(MATCHES_KEY, [])
      ]);
    } catch (error) {
      console.error('Erreur lors de l\'effacement des données:', error);
      throw error;
    }
  }

  // Obtenir les statistiques
  static async getStats(): Promise<{ studentsCount: number; pendingMatches: number; completedMatches: number }> {
    try {
      const [students, matches] = await Promise.all([
        this.getStudents(),
        this.getMatches()
      ]);

      const pendingMatches = matches.filter(m => m.statut === 'pending').length;
      const completedMatches = matches.filter(m => m.statut !== 'pending').length;

      return {
        studentsCount: students.length,
        pendingMatches,
        completedMatches
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { studentsCount: 0, pendingMatches: 0, completedMatches: 0 };
    }
  }
}