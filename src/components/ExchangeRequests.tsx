import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Student } from '../types/student';
import { Users, ArrowRight, Trash2 } from 'lucide-react';

interface ExchangeRequestsProps {
  students: Student[];
  onDeleteStudent?: (studentId: string) => Promise<void>;
}

export const ExchangeRequests: React.FC<ExchangeRequestsProps> = ({ students, onDeleteStudent }) => {
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (onDeleteStudent && window.confirm(`Êtes-vous sûr de vouloir supprimer la demande de ${studentName} ?`)) {
      try {
        await onDeleteStudent(studentId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5" />
          <h2>Toutes les demandes d'échange</h2>
          <Badge variant="secondary">{students.length}</Badge>
          <Badge variant="outline" className="ml-2 text-green-700 border-green-200">
            Partagées globalement
          </Badge>
        </div>
        {onDeleteStudent && (
          <p className="text-sm text-muted-foreground">
            Vous pouvez supprimer une demande en cliquant sur l'icône de corbeille à côté.
          </p>
        )}
      </div>
      
      {students.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune demande d'échange pour le moment</p>
              <p className="text-sm mt-2">Les demandes d'autres utilisateurs apparaîtront ici automatiquement</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => (
            <Card key={student.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{student.prenom} {student.nom}</p>
                        <p className="text-sm text-muted-foreground">CIN: {student.cin}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <Badge variant="outline">{student.tdActuel}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">TD Actuel</p>
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    
                    <div className="text-center">
                      <Badge>{student.tdSouhaite}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">TD Souhaité</p>
                    </div>

                    {onDeleteStudent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id, `${student.prenom} ${student.nom}`)}
                        className="ml-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Supprimer cette demande"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Inscrit le {new Date(student.dateInscription).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};