import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Student, Match } from '../types/student';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-34171d7d`;

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = `${BASE_URL}${endpoint}`;
        
        // Timeout plus long avec tentatives
        const timeout = 15000 + (attempt * 5000); // 15s, puis 20s, puis 25s
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            ...options.headers,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorText = 'Erreur de connexion au serveur';
          try {
            errorText = await response.text();
          } catch {
            errorText = `Erreur HTTP ${response.status}`;
          }
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        return response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erreur inconnue');
        
        if (lastError.name === 'AbortError') {
          lastError = new Error(`Timeout de connexion (tentative ${attempt + 1}/${retries + 1})`);
        } else if (lastError.message.includes('Failed to fetch') || lastError.message.includes('NetworkError')) {
          lastError = new Error('Problème de connexion réseau');
        }
        
        // Si c'est la dernière tentative ou si l'erreur n'est pas liée au réseau, on arrête
        if (attempt === retries || (!lastError.message.includes('Timeout') && !lastError.message.includes('réseau'))) {
          break;
        }
        
        // Attendre avant la prochaine tentative
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    
    throw lastError;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async getWithRetry<T>(endpoint: string, retries: number): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, retries);
  }
}

export interface StoredData {
  students: Student[];
  matches: Match[];
}

export class SupabaseService {
  private static client = new ApiClient();

  // Récupérer tous les étudiants
  static async getStudents(): Promise<Student[]> {
    try {
      const response = await this.client.get<{ students: Student[] }>('/students');
      return response.students || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      return [];
    }
  }

  // Ajouter un étudiant
  static async addStudent(student: Student): Promise<void> {
    try {
      await this.client.post('/students', student);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'étudiant:', error);
      throw error;
    }
  }

  // Récupérer tous les matchs
  static async getMatches(): Promise<Match[]> {
    try {
      const response = await this.client.get<{ matches: Match[] }>('/matches');
      return response.matches || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des matchs:', error);
      return [];
    }
  }

  // Mettre à jour les matchs
  static async updateMatches(matches: Match[]): Promise<void> {
    try {
      await this.client.post('/matches', { matches });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des matchs:', error);
      throw error;
    }
  }

  // Ajouter de nouveaux matchs
  static async addMatches(newMatches: Match[]): Promise<number> {
    try {
      const response = await this.client.post<{ addedCount: number }>('/matches/add', { newMatches });
      return response.addedCount || 0;
    } catch (error) {
      console.error('Erreur lors de l\'ajout des matchs:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'un match
  static async updateMatchStatus(matchId: string, status: 'accepted' | 'declined'): Promise<void> {
    try {
      await this.client.put(`/matches/${matchId}`, { status });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du match:', error);
      throw error;
    }
  }

  // Supprimer un étudiant spécifique
  static async deleteStudent(studentId: string): Promise<void> {
    try {
      await this.client.delete(`/students/${studentId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'étudiant:', error);
      throw error;
    }
  }

  // Effacer toutes les données
  static async clearAllData(): Promise<void> {
    try {
      await this.client.delete('/data');
    } catch (error) {
      console.error('Erreur lors de l\'effacement des données:', error);
      throw error;
    }
  }

  // Obtenir les statistiques
  static async getStats(): Promise<{ studentsCount: number; pendingMatches: number; completedMatches: number }> {
    try {
      const stats = await this.client.get<{ studentsCount: number; pendingMatches: number; completedMatches: number }>('/stats');
      return stats;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { studentsCount: 0, pendingMatches: 0, completedMatches: 0 };
    }
  }

  // Vérifier la connectivité réseau basique
  static async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Test de connectivité basique avec Google DNS
      await fetch('https://8.8.8.8/', { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      return true;
    } catch {
      try {
        // Fallback avec Cloudflare DNS
        await fetch('https://1.1.1.1/', { 
          method: 'HEAD', 
          mode: 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        return true;
      } catch {
        return false;
      }
    }
  }

  // Vérifier la santé du serveur avec retry intelligent
  static async checkHealth(): Promise<boolean> {
    try {
      // D'abord vérifier la connectivité réseau
      const hasNetwork = await this.checkNetworkConnectivity();
      if (!hasNetwork) {
        throw new Error('Pas de connexion internet');
      }

      // Puis tester le serveur avec retry limité  
      await this.client.getWithRetry('/health', 1);
      return true;
    } catch (error) {
      console.error('Le serveur n\'est pas disponible:', error);
      return false;
    }
  }
}