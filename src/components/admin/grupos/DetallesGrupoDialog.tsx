import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Group = Database['public']['Tables']['groups']['Row'];
type GroupMember = Database['public']['Tables']['group_members']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface DetallesGrupoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onSuccess: () => void;
}

export default function DetallesGrupoDialog({
  open,
  onOpenChange,
  group,
  onSuccess
}: DetallesGrupoDialogProps) {
  const [members, setMembers] = useState<(GroupMember & { customer: Customer })[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && group) {
      fetchGroupMembers();
    }
  }, [open, group]);

  const fetchGroupMembers = async () => {
    if (!group) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, customer:customers(*)')
        .eq('group_id', group.id);

      if (error) throw error;

      setMembers(data as (GroupMember & { customer: Customer })[]);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros del grupo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Group['status']) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_proceso: 'bg-blue-100 text-blue-800',
      completado: 'bg-green-100 text-green-800',
      entregado: 'bg-purple-100 text-purple-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getStatusLabel = (status: Group['status']) => {
    const labels = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    return labels[status];
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalles del Grupo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del grupo */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">{group.name}</h3>
              <p className="text-gray-500">{group.institution}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Entrega
                </label>
                <p className="mt-1">
                  {format(new Date(group.delivery_date), 'PPP', { locale: es })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(group.status)}`}>
                  {getStatusLabel(group.status)}
                </span>
              </div>
            </div>

            {group.comments && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Comentarios
                </label>
                <p className="mt-1 text-gray-600">{group.comments}</p>
              </div>
            )}
          </div>

          {/* Lista de miembros */}
          <div>
            <h3 className="text-lg font-medium mb-4">Miembros del Grupo</h3>
            {loading ? (
              <div className="text-center py-4">Cargando miembros...</div>
            ) : members.length === 0 ? (
              <p className="text-gray-500">No hay miembros en este grupo</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{member.customer.name}</h4>
                        <p className="text-sm text-gray-500">{member.customer.phone}</p>
                        {member.customer.email && (
                          <p className="text-sm text-gray-500">{member.customer.email}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implementar vista de orden
                        }}
                      >
                        Ver Orden
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 