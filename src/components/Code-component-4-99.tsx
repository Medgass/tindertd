import React from 'react';
import { Card, CardContent } from './ui/card';
import { Info, Users, RefreshCw, Globe } from 'lucide-react';

export const SharedDataInfo = () => {
  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <div className="font-medium text-blue-900">
              Plateforme collaborative en temps réel
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Toutes les demandes d'échange sont visibles par tous les utilisateurs</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Les matchs automatiques apparaissent instantanément pour tous</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>Synchronisation automatique toutes les 10 secondes</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};