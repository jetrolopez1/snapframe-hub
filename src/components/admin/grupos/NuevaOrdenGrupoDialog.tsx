import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { GroupMember } from './DetallesGrupoDialog';

interface PhotoPackage {
  id: string;
  name: string;
  description: string;
  base_price: number;
  options: {
    id: string;
    name: string;
    price_increment: number;
  }[];
}

interface NuevaOrdenGrupoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: GroupMember | null;
  groupId: string;
  onSuccess: () => void;
}

const orderSchema = z.object({
  package_id: z.string().min(1, 'Debe seleccionar un paquete'),
  selected_options: z.array(z.string()),
  comments: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const NuevaOrdenGrupoDialog: React.FC<NuevaOrdenGrupoDialogProps> = ({
  open,
  onOpenChange,
  member,
  groupId,
  onSuccess
}) => {
  const [packages, setPackages] = useState<PhotoPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PhotoPackage | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      selected_options: [],
      comments: ''
    }
  });

  useEffect(() => {
    if (open) {
      fetchPackages();
    } else {
      reset();
      setSelectedPackage(null);
    }
  }, [open]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_packages')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      setPackages(data || []);
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes fotográficos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const watchPackageId = watch('package_id');
  const watchSelectedOptions = watch('selected_options');

  useEffect(() => {
    if (watchPackageId) {
      const pkg = packages.find(p => p.id === watchPackageId);
      setSelectedPackage(pkg || null);
    }
  }, [watchPackageId, packages]);

  const calculateTotal = () => {
    if (!selectedPackage) return 0;

    let total = selectedPackage.base_price;

    if (watchSelectedOptions && selectedPackage.options) {
      selectedPackage.options.forEach(option => {
        if (watchSelectedOptions.includes(option.id)) {
          total += option.price_increment;
        }
      });
    }

    return total;
  };

  const onSubmit = async (data: OrderFormData) => {
    if (!member || !selectedPackage) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          customer_id: member.customer.id,
          group_id: groupId,
          package_id: data.package_id,
          selected_options: data.selected_options,
          total_price: calculateTotal(),
          status: 'pendiente',
          comments: data.comments || null,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "La orden ha sido creada correctamente",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al crear orden:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la orden",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 2 
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nueva Orden para {member?.customer.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-pulse text-gray-500">Cargando paquetes...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Selección de paquete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paquete Fotográfico
              </label>
              <select
                {...register('package_id')}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Seleccionar paquete...</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - {formatPrice(pkg.base_price)}
                  </option>
                ))}
              </select>
              {errors.package_id && (
                <p className="mt-1 text-sm text-red-600">{errors.package_id.message}</p>
              )}
            </div>

            {/* Opciones del paquete */}
            {selectedPackage && selectedPackage.options && selectedPackage.options.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opciones Adicionales
                </label>
                <div className="space-y-2">
                  {selectedPackage.options.map((option) => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        value={option.id}
                        {...register('selected_options')}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span>
                        {option.name} (+{formatPrice(option.price_increment)})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Comentarios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios (opcional)
              </label>
              <textarea
                {...register('comments')}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>

            {/* Total */}
            {selectedPackage && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-bold">{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Creando orden...' : 'Crear Orden'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NuevaOrdenGrupoDialog; 