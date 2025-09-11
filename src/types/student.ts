export interface Student {
  id: string;
  nom: string;
  prenom: string;
  cin: string;
  tdActuel: string;
  tdSouhaite: string;
  dateInscription: string;
}

export interface Match {
  id: string;
  etudiant1: Student;
  etudiant2: Student;
  dateMatch: string;
  statut: 'pending' | 'accepted' | 'declined';
}