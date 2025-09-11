import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { DatabaseStudent, searchStudents, findStudentByCIN } from '../data/studentsDatabase';
import { Search, User, Check } from 'lucide-react';

interface StudentSelectorProps {
  onSelect: (student: DatabaseStudent) => void;
  selectedStudent?: DatabaseStudent | null;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({ onSelect, selectedStudent }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DatabaseStudent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchStudents(query);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
      setHighlightedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset l'affichage des résultats quand un étudiant est sélectionné
  useEffect(() => {
    if (selectedStudent) {
      setIsOpen(false);
      setQuery(`${selectedStudent.prenom} ${selectedStudent.nom} (${selectedStudent.cin})`);
    } else {
      setQuery('');
    }
  }, [selectedStudent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (student: DatabaseStudent) => {
    onSelect(student);
    setQuery(`${student.prenom} ${student.nom} (${student.cin})`);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onSelect(null as any);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Petit délai pour permettre au clic de se traiter avant de fermer
    setTimeout(() => {
      // Vérifier si l'utilisateur a entré un CIN valide
      const trimmedQuery = query.trim();
      if (trimmedQuery.length >= 8) {
        const student = findStudentByCIN(trimmedQuery);
        if (student) {
          handleSelect(student);
          return;
        }
      }
      setIsOpen(false);
    }, 150);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="student-search">Rechercher un étudiant</Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="student-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Tapez le nom, prénom ou CIN..."
            className="pl-10 pr-10"
          />
          {selectedStudent && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
        </div>
        
        {isOpen && results.length > 0 && (
          <div 
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {results.map((student, index) => (
              <div
                key={student.cin}
                onMouseDown={(e) => {
                   e.preventDefault(); // Empêche le blur de l'input
                   handleSelect(student);
                 }}
                className={`px-4 py-3 cursor-pointer border-b border-border last:border-b-0 hover:bg-accent ${
                  index === highlightedIndex ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{student.prenom} {student.nom}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">CIN: {student.cin}</span>
                      <Badge variant="outline" className="text-xs">{student.td}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedStudent && (
        <Card className="mt-3">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedStudent.prenom} {selectedStudent.nom}</span>
                  <Badge variant="outline">{selectedStudent.td}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">CIN: {selectedStudent.cin}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <p className="text-xs text-muted-foreground">
        Vous pouvez rechercher par nom, prénom ou numéro CIN. 
        Si vous n'êtes pas dans la base, vous pourrez saisir vos informations manuellement.
      </p>
    </div>
  );
};