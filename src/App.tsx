import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { StudentRegistrationForm } from './components/StudentRegistrationForm';
import { ExchangeRequests } from './components/ExchangeRequests';
import { MatchList } from './components/MatchList';
import { StudentDatabase } from './components/StudentDatabase';
import { SharedDataInfo } from './components/SharedDataInfo';
import { useSupabaseData } from './hooks/useSupabaseData';
import { findMatches, generateStudentId } from './utils/matching';
import { Student, Match } from './types/student';
import { Users, RefreshCw, UserPlus, BookOpen, Database, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './components/ui/alert';

export default function App() {
  const { 
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
  } = useSupabaseData();
  
  const [activeTab, setActiveTab] = useState('inscription');

  // Recalculer les matchs quand la liste d'étudiants change
  useEffect(() => {
    if (students.length > 0) {
      const newMatches = findMatches(students);
      addMatches(newMatches).catch(console.error);
    }
  }, [students, addMatches]);

  const handleStudentSubmit = async (studentData: Omit<Student, 'id' | 'dateInscription'>) => {
    const newStudent: Student = {
      ...studentData,
      id: generateStudentId(),
      dateInscription: new Date().toISOString()
    };
    
    try {
      await addStudent(newStudent);
      setActiveTab('demandes');
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
    }
  };

  const handleAcceptMatch = async (matchId: string) => {
    try {
      await updateMatchStatus(matchId, 'accepted');
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
    }
  };

  const handleDeclineMatch = async (matchId: string) => {
    try {
      await updateMatchStatus(matchId, 'declined');
    } catch (error) {
      console.error('Erreur lors du refus:', error);
    }
  };

  const handleClearData = async () => {
    try {
      await clearAllData();
    } catch (error) {
      console.error('Erreur lors de l\'effacement:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshData();
      toast.success('Données synchronisées !');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      toast.error('Erreur de synchronisation');
    }
  };

  const pendingMatches = matches.filter(m => m.statut === 'pending');
  const completedMatches = matches.filter(m => m.statut !== 'pending');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1>Plateforme d'Échange de TD</h1>
            <div className="flex items-center gap-2 ml-4">
              {loading ? (
                <WifiOff className="h-4 w-4 text-orange-500 animate-pulse" />
              ) : error ? (
                <WifiOff className="h-4 w-4 text-red-500" />
              ) : (
                <Wifi className="h-4 w-4 text-green-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {loading ? 'Synchronisation...' : 
                 error ? (
                   <span className="text-red-600" title={error}>
                     {error.includes('Timeout') ? 'Timeout' : 
                      error.includes('réseau') ? 'Réseau' : 
                      error.includes('internet') ? 'Internet' : 'Erreur'}
                   </span>
                 ) : 
                 lastSync ? `Sync: ${lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'En ligne'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                className="ml-2"
                disabled={loading}
                title={error ? `Réessayer la connexion (${error})` : "Forcer la synchronisation"}
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Facilitez les échanges de créneaux de TD entre étudiants. 
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm ml-2">
              <Users className="h-3 w-3" />
              Données partagées en temps réel
            </span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive flex items-center justify-between">
              <span>
                <strong>Problème de connexion :</strong> {error}
                <br />
                <span className="text-sm">
                  {error.includes('Timeout') ? 
                    'Le serveur met trop de temps à répondre. Vérifiez votre connexion internet et réessayez.' :
                   error.includes('réseau') || error.includes('internet') ? 
                    'Problème de connexion internet. Vérifiez votre réseau wifi ou données mobiles.' :
                   error.includes('500') ? 
                    'Erreur du serveur. Le problème est temporaire, réessayez dans quelques instants.' :
                    'Les données peuvent ne pas être synchronisées. Cliquez sur le bouton de synchronisation pour réessayer.'
                  }
                </span>
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="ml-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={loading}
              >
                {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Réessayer'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <UserPlus className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.studentsCount}</p>
                  <p className="text-sm text-muted-foreground">Étudiants inscrits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <RefreshCw className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingMatches}</p>
                  <p className="text-sm text-muted-foreground">Matchs en attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.completedMatches}</p>
                  <p className="text-sm text-muted-foreground">Échanges traités</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info about shared data */}
        <SharedDataInfo />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full grid-cols-4 max-w-lg">
              <TabsTrigger value="inscription">Inscription</TabsTrigger>
              <TabsTrigger value="demandes">
                Demandes
                {stats.studentsCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {stats.studentsCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="matches">
                Matchs
                {matches.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {matches.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="database">
                <Database className="h-4 w-4 mr-1" />
                Base
              </TabsTrigger>
            </TabsList>
            
            {(stats.studentsCount > 0 || matches.length > 0) && (
              <Button variant="outline" onClick={handleClearData} size="sm">
                Effacer les données
              </Button>
            )}
          </div>

          <TabsContent value="inscription">
            <StudentRegistrationForm onSubmit={handleStudentSubmit} />
          </TabsContent>

          <TabsContent value="demandes">
            <ExchangeRequests students={students} onDeleteStudent={deleteStudent} />
          </TabsContent>

          <TabsContent value="matches">
            <MatchList 
              matches={matches} 
              onAcceptMatch={handleAcceptMatch}
              onDeclineMatch={handleDeclineMatch}
            />
          </TabsContent>

          <TabsContent value="database">
            <StudentDatabase />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}