import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, MoreHorizontal, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import NuevoGrupoDialog from '@/components/admin/grupos/NuevoGrupoDialog';
import DetallesGrupoDialog from '@/components/admin/grupos/DetallesGrupoDialog';
import type { Groups } from '@/types/database.types';

const GruposPage = () => {
  const [showNuevoGrupoDialog, setShowNuevoGrupoDialog] = useState(false);
  const [showDetallesDialog, setShowDetallesDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Groups | null>(null);
  const [groups, setGroups] = useState<Groups[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('delivery_date', { ascending: true });

      if (error) throw error;

      setGroups(data || []);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Obtener color de acuerdo al estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'entregado':
        return 'bg-purple-100 text-purple-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener etiqueta de estado en español
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_proceso':
        return 'En proceso';
      case 'completado':
        return 'Completado';
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Función para mostrar detalles
  const handleShowDetails = (group: Groups) => {
    setSelectedGroup(group);
    setShowDetallesDialog(true);
  };

  // Filtrar grupos
  const filteredGroups = groups.filter(group => {
    const searchLower = searchTerm.toLowerCase();
    return (
      group.name.toLowerCase().includes(searchLower) ||
      group.institution.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Grupos</h1>
        <Button onClick={() => setShowNuevoGrupoDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Grupo
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre o institución..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de grupos */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-pulse text-gray-500">Cargando grupos...</div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron grupos</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="border rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => handleShowDetails(group)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.institution}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                  {getStatusLabel(group.status)}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(group.delivery_date)}
              </div>
              {group.comments && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{group.comments}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Diálogos */}
      <NuevoGrupoDialog
        open={showNuevoGrupoDialog}
        onOpenChange={setShowNuevoGrupoDialog}
        onSuccess={() => {
          fetchGroups();
          setShowNuevoGrupoDialog(false);
        }}
      />

      <DetallesGrupoDialog
        open={showDetallesDialog}
        onOpenChange={setShowDetallesDialog}
        group={selectedGroup}
        onSuccess={fetchGroups}
      />
    </div>
  );
};

export default GruposPage; 