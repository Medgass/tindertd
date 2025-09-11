import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { studentsDatabase, getAllTDs, getStudentsByTD, searchStudents } from '../data/studentsDatabase';
import { Database, Search, Users, Filter } from 'lucide-react';

export const StudentDatabase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTD, setSelectedTD] = useState<string>('all');
  
  const allTDs = getAllTDs();
  
  const getFilteredStudents = () => {
    let filtered = studentsDatabase;
    
    if (selectedTD !== 'all') {
      filtered = getStudentsByTD(selectedTD);
    }
    
    if (searchQuery.length >= 2) {
      const searchResults = searchStudents(searchQuery);
      filtered = selectedTD !== 'all' 
        ? searchResults.filter(s => s.td === selectedTD)
        : searchResults;
    }
    
    return filtered;
  };

  const filteredStudents = getFilteredStudents();
  
  const getStudentCountByTD = () => {
    const counts: { [key: string]: number } = {};
    allTDs.forEach(td => {
      counts[td] = getStudentsByTD(td).length;
    });
    return counts;
  };

  const studentCounts = getStudentCountByTD();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-5 w-5" />
        <h2>Base de données des étudiants</h2>
        <Badge variant="secondary">{studentsDatabase.length} étudiants</Badge>
      </div>

      {/* Stats par TD */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {allTDs.map(td => (
          <Card key={td}>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{studentCounts[td]}</p>
                <p className="text-sm text-muted-foreground">{td}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom, prénom ou CIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrer par TD</label>
              <Select value={selectedTD} onValueChange={setSelectedTD}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les TD</SelectItem>
                  {allTDs.map(td => (
                    <SelectItem key={td} value={td}>
                      {td} ({studentCounts[td]} étudiants)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des étudiants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Étudiants
            </div>
            <Badge variant="secondary">
              {filteredStudents.length} résultat{filteredStudents.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun étudiant trouvé</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div key={student.cin} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium">{student.prenom} {student.nom}</p>
                    <p className="text-sm text-muted-foreground">CIN: {student.cin}</p>
                  </div>
                  <Badge variant="outline">{student.td}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};