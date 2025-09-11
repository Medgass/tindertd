import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { StudentSelector } from './StudentSelector';
import { Student } from '../types/student';
import { DatabaseStudent, getAllTDs } from '../data/studentsDatabase';
import { UserCheck, UserPlus } from 'lucide-react';

interface StudentRegistrationFormProps {
  onSubmit: (student: Omit<Student, 'id' | 'dateInscription'>) => void;
}

export const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ onSubmit }) => {
  const [selectedStudent, setSelectedStudent] = React.useState<DatabaseStudent | null>(null);
  const [isManualEntry, setIsManualEntry] = React.useState(false);
  const [formData, setFormData] = React.useState({
    nom: '',
    prenom: '',
    cin: '',
    tdActuel: '',
    tdSouhaite: ''
  });

  const groupesTD = getAllTDs();

  const handleStudentSelect = (student: DatabaseStudent) => {
    setSelectedStudent(student);
    setFormData({
      nom: student.nom,
      prenom: student.prenom,
      cin: student.cin,
      tdActuel: student.td,
      tdSouhaite: ''
    });
  };

  const handleManualEntry = () => {
    setIsManualEntry(true);
    setSelectedStudent(null);
    setFormData({ nom: '', prenom: '', cin: '', tdActuel: '', tdSouhaite: '' });
  };

  const handleBackToSearch = () => {
    setIsManualEntry(false);
    setSelectedStudent(null);
    setFormData({ nom: '', prenom: '', cin: '', tdActuel: '', tdSouhaite: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nom && formData.prenom && formData.cin && formData.tdActuel && formData.tdSouhaite) {
      onSubmit(formData);
      setFormData({ nom: '', prenom: '', cin: '', tdActuel: '', tdSouhaite: '' });
      setSelectedStudent(null);
      setIsManualEntry(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Inscription pour l'échange de TD
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isManualEntry && !selectedStudent && (
          <div className="space-y-6">
            <StudentSelector onSelect={handleStudentSelect} selectedStudent={selectedStudent} />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleManualEntry}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Saisie manuelle des informations
            </Button>
          </div>
        )}

        {(isManualEntry || selectedStudent) && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isManualEntry && selectedStudent && (
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Étudiant sélectionné :</p>
                  <Button type="button" variant="ghost" size="sm" onClick={handleBackToSearch}>
                    Changer
                  </Button>
                </div>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedStudent.prenom} {selectedStudent.nom}</p>
                  <p className="text-sm text-muted-foreground">CIN: {selectedStudent.cin} • TD: {selectedStudent.td}</p>
                </div>
              </div>
            )}

            {isManualEntry && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Saisie manuelle des informations</p>
                  <Button type="button" variant="ghost" size="sm" onClick={handleBackToSearch}>
                    ← Retour à la recherche
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      placeholder="Votre prénom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cin">CIN</Label>
                  <Input
                    id="cin"
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    placeholder="Votre numéro CIN"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tdActuel">TD Actuel</Label>
                  <Select value={formData.tdActuel} onValueChange={(value) => setFormData({ ...formData, tdActuel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre TD actuel" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupesTD.map((td) => (
                        <SelectItem key={td} value={td}>{td}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="tdSouhaite">TD Souhaité</Label>
              <Select 
                value={formData.tdSouhaite} 
                onValueChange={(value) => setFormData({ ...formData, tdSouhaite: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le TD souhaité" />
                </SelectTrigger>
                <SelectContent>
                  {groupesTD.filter(td => td !== formData.tdActuel).map((td) => (
                    <SelectItem key={td} value={td}>{td}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={!formData.tdActuel || !formData.tdSouhaite || formData.tdActuel === formData.tdSouhaite}
            >
              S'inscrire pour l'échange
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};