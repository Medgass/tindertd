import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Match } from '../types/student';
import { CheckCircle2, Clock, RefreshCw, Users } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  onAcceptMatch?: (matchId: string) => void;
  onDeclineMatch?: (matchId: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({ matches, onAcceptMatch, onDeclineMatch }) => {
  const getStatusIcon = (status: Match['statut']) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'declined':
        return <RefreshCw className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status: Match['statut']) => {
    switch (status) {
      case 'accepted':
        return 'Échange accepté';
      case 'declined':
        return 'Échange refusé';
      default:
        return 'En attente';
    }
  };

  const getStatusVariant = (status: Match['statut']) => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'declined':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <RefreshCw className="h-5 w-5" />
        <h2>Tous les matchs disponibles</h2>
        <Badge variant="secondary">{matches.length}</Badge>
        <Badge variant="outline" className="ml-2 text-green-700 border-green-200">
          Partagés globalement
        </Badge>
      </div>
      
      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune correspondance trouvée pour le moment</p>
              <p className="text-sm mt-2">Les matchs créés par le système apparaîtront ici pour tous les utilisateurs</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Des correspondances ont été trouvées ! Tous les utilisateurs peuvent voir et gérer ces échanges.
            </AlertDescription>
          </Alert>
          
          {matches.map((match) => (
            <Card key={match.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Correspondance
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(match.statut)}
                    <Badge variant={getStatusVariant(match.statut)}>
                      {getStatusText(match.statut)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">{match.etudiant1.prenom} {match.etudiant1.nom}</h4>
                      <p className="text-sm text-muted-foreground mb-2">CIN: {match.etudiant1.cin}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{match.etudiant1.tdActuel}</Badge>
                        <span className="text-sm">→</span>
                        <Badge>{match.etudiant1.tdSouhaite}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">{match.etudiant2.prenom} {match.etudiant2.nom}</h4>
                      <p className="text-sm text-muted-foreground mb-2">CIN: {match.etudiant2.cin}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{match.etudiant2.tdActuel}</Badge>
                        <span className="text-sm">→</span>
                        <Badge>{match.etudiant2.tdSouhaite}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Correspondance trouvée le {new Date(match.dateMatch).toLocaleDateString('fr-FR')}
                    </p>
                    
                    {match.statut === 'pending' && onAcceptMatch && onDeclineMatch && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onDeclineMatch(match.id)}
                        >
                          Refuser
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => onAcceptMatch(match.id)}
                        >
                          Accepter l'échange
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};