import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Configuration CORS
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
}));

// Logger pour le débogage
app.use('*', logger(console.log));

// Clés pour le stockage KV
const STUDENTS_KEY = 'td-exchange-students';
const MATCHES_KEY = 'td-exchange-matches';

// Route de santé avec vérification de la base de données
app.get('/make-server-34171d7d/health', async (c) => {
  try {
    // Test simple et rapide de connexion à la base de données
    const startTime = Date.now();
    await kv.get('health-check-key');
    const responseTime = Date.now() - startTime;
    
    return c.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      responseTime: `${responseTime}ms`,
      server: 'healthy'
    });
  } catch (error) {
    console.log('Erreur lors du check de santé:', error);
    return c.json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error?.message || 'Erreur de base de données',
      server: 'unhealthy'
    }, 500);
  }
});

// Récupérer tous les étudiants
app.get('/make-server-34171d7d/students', async (c) => {
  try {
    const students = await kv.get(STUDENTS_KEY) || [];
    console.log(`Récupération réussie: ${students.length} étudiants`);
    return c.json({ students });
  } catch (error) {
    console.log('Erreur lors de la récupération des étudiants:', error);
    return c.json({ 
      error: 'Erreur de base de données lors de la récupération des étudiants', 
      details: error.message || 'Erreur inconnue',
      students: [] 
    }, 500);
  }
});

// Ajouter un étudiant
app.post('/make-server-34171d7d/students', async (c) => {
  try {
    const student = await c.req.json();
    const currentStudents = await kv.get(STUDENTS_KEY) || [];
    const updatedStudents = [...currentStudents, student];
    await kv.set(STUDENTS_KEY, updatedStudents);
    
    return c.json({ success: true, student });
  } catch (error) {
    console.log('Erreur lors de l\'ajout de l\'étudiant:', error);
    return c.json({ error: 'Erreur lors de l\'ajout' }, 500);
  }
});

// Récupérer tous les matchs
app.get('/make-server-34171d7d/matches', async (c) => {
  try {
    const matches = await kv.get(MATCHES_KEY) || [];
    console.log(`Récupération réussie: ${matches.length} matchs`);
    return c.json({ matches });
  } catch (error) {
    console.log('Erreur lors de la récupération des matchs:', error);
    return c.json({ 
      error: 'Erreur de base de données lors de la récupération des matchs', 
      details: error.message || 'Erreur inconnue',
      matches: [] 
    }, 500);
  }
});

// Mettre à jour les matchs
app.post('/make-server-34171d7d/matches', async (c) => {
  try {
    const { matches } = await c.req.json();
    await kv.set(MATCHES_KEY, matches);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Erreur lors de la mise à jour des matchs:', error);
    return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
  }
});

// Ajouter de nouveaux matchs
app.post('/make-server-34171d7d/matches/add', async (c) => {
  try {
    const { newMatches } = await c.req.json();
    const currentMatches = await kv.get(MATCHES_KEY) || [];
    const existingMatchIds = currentMatches.map(m => m.id);
    const freshMatches = newMatches.filter(match => !existingMatchIds.includes(match.id));
    
    if (freshMatches.length > 0) {
      const updatedMatches = [...currentMatches, ...freshMatches];
      await kv.set(MATCHES_KEY, updatedMatches);
    }
    
    return c.json({ success: true, addedCount: freshMatches.length });
  } catch (error) {
    console.log('Erreur lors de l\'ajout des matchs:', error);
    return c.json({ error: 'Erreur lors de l\'ajout' }, 500);
  }
});

// Mettre à jour le statut d'un match
app.put('/make-server-34171d7d/matches/:id', async (c) => {
  try {
    const matchId = c.req.param('id');
    const { status } = await c.req.json();
    
    const currentMatches = await kv.get(MATCHES_KEY) || [];
    const updatedMatches = currentMatches.map(match => 
      match.id === matchId ? { ...match, statut: status } : match
    );
    
    await kv.set(MATCHES_KEY, updatedMatches);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Erreur lors de la mise à jour du statut du match:', error);
    return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
  }
});

// Obtenir les statistiques
app.get('/make-server-34171d7d/stats', async (c) => {
  try {
    // Récupération avec timeout implicite et gestion d'erreur robuste
    const [studentsResult, matchesResult] = await Promise.allSettled([
      kv.get(STUDENTS_KEY),
      kv.get(MATCHES_KEY)
    ]);
    
    const students = studentsResult.status === 'fulfilled' ? (studentsResult.value || []) : [];
    const matches = matchesResult.status === 'fulfilled' ? (matchesResult.value || []) : [];
    
    const pendingMatches = matches.filter(m => m?.statut === 'pending').length;
    const completedMatches = matches.filter(m => m?.statut && m.statut !== 'pending').length;
    
    console.log(`Statistiques calculées: ${students.length} étudiants, ${pendingMatches} matchs en attente, ${completedMatches} matchs traités`);
    
    return c.json({
      studentsCount: students.length,
      pendingMatches,
      completedMatches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('Erreur lors de la récupération des statistiques:', error);
    return c.json({ 
      error: 'Erreur de base de données lors du calcul des statistiques', 
      details: error?.message || 'Erreur inconnue',
      studentsCount: 0, 
      pendingMatches: 0, 
      completedMatches: 0,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Supprimer un étudiant spécifique
app.delete('/make-server-34171d7d/students/:id', async (c) => {
  try {
    const studentId = c.req.param('id');
    
    // Récupérer les données actuelles
    const currentStudents = await kv.get(STUDENTS_KEY) || [];
    const currentMatches = await kv.get(MATCHES_KEY) || [];
    
    // Supprimer l'étudiant
    const updatedStudents = currentStudents.filter(student => student.id !== studentId);
    
    // Supprimer les matchs associés à cet étudiant
    const updatedMatches = currentMatches.filter(match => 
      match.etudiant1Id !== studentId && match.etudiant2Id !== studentId
    );
    
    // Sauvegarder les modifications
    await kv.set(STUDENTS_KEY, updatedStudents);
    await kv.set(MATCHES_KEY, updatedMatches);
    
    console.log(`Étudiant ${studentId} supprimé avec succès`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Erreur lors de la suppression de l\'étudiant:', error);
    return c.json({ error: 'Erreur lors de la suppression' }, 500);
  }
});

// Effacer toutes les données
app.delete('/make-server-34171d7d/data', async (c) => {
  try {
    await kv.set(STUDENTS_KEY, []);
    await kv.set(MATCHES_KEY, []);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Erreur lors de l\'effacement des données:', error);
    return c.json({ error: 'Erreur lors de l\'effacement' }, 500);
  }
});

// Démarrer le serveur
Deno.serve(app.fetch);