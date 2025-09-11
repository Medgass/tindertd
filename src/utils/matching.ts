import { Student, Match } from '../types/student';

export function findMatches(students: Student[]): Match[] {
  const matches: Match[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < students.length; i++) {
    const student1 = students[i];
    
    if (processed.has(student1.id)) continue;

    for (let j = i + 1; j < students.length; j++) {
      const student2 = students[j];
      
      if (processed.has(student2.id)) continue;

      // Vérifier si les étudiants peuvent échanger
      if (student1.tdActuel === student2.tdSouhaite && 
          student1.tdSouhaite === student2.tdActuel) {
        
        const match: Match = {
          id: `${student1.id}-${student2.id}`,
          etudiant1: student1,
          etudiant2: student2,
          dateMatch: new Date().toISOString(),
          statut: 'pending'
        };
        
        matches.push(match);
        processed.add(student1.id);
        processed.add(student2.id);
        break;
      }
    }
  }

  return matches;
}

export function generateStudentId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}