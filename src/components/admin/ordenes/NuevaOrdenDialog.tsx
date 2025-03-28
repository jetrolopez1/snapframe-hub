
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Esquema para la búsqueda de cliente
const clienteSearchSchema = z.object({
  phone: z.string().min(1, "El teléfono es requerido para buscar")
});

// Esquema para nuevo cliente
const nuevoClienteSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
  email: z.string().email("Ingresa un email válido").or(z.string().length(0)).optional(),
  address: z.string().optional()
});

// Esquema para la orden
const ordenSchema = z.object({
  delivery_format: z.enum(['impresa', 'digital', 'ambos'], {
    required_error: "Selecciona un formato de entrega"
  }),
  total_price: z.coerce.number().min(1, "El precio total debe ser mayor a 0"),
  advance_payment: z.coerce.number().min(0, "El anticipo no puede ser negativo").optional(),
  comments: z.string().optional(),
  // cliente_id se asignará después
});

// Tipos para formularios
type ClienteSearchValues = z.infer<typeof clienteSearchSchema>;
type NuevoClienteValues = z.infer<typeof nuevoClienteSchema>;
type OrdenValues = z.infer<typeof ordenSchema>;

interface NuevaOrdenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NuevaOrdenDialog: React.FC<NuevaOrdenDialogProps> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState<'buscar_cliente' | 'nuevo_cliente' | 'detalles_orden'>('buscar_cliente');
  const [isClienteNuevo, setIsClienteNuevo] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const { toast } = useToast();

  // Formulario para búsqueda de cliente
  const searchForm = useForm<ClienteSearchValues>({
    resolver: zodResolver(clienteSearchSchema),
    defaultValues: {
      phone: ''
    }
  });

  // Formulario para nuevo cliente
  const nuevoClienteForm = useForm<NuevoClienteValues>({
    resolver: zodResolver(nuevoClienteSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: ''
    }
  });

  // Formulario para orden
  const ordenForm = useForm<OrdenValues>({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      delivery_format: 'impresa',
      total_price: 0,
      advance_payment: 0,
      comments: ''
    }
  });

  // Si el diálogo se cierra, resetear todo
  useEffect(() => {
    if (!open) {
      setStep('buscar_cliente');
      setIsClienteNuevo(false);
      setClienteEncontrado(null);
      searchForm.reset();
      nuevoClienteForm.reset();
      ordenForm.reset();
    }
  }, [open, searchForm, nuevoClienteForm, ordenForm]);

  // Buscar cliente por teléfono
  const handleBuscarCliente = async (values: ClienteSearchValues) => {
    setBuscandoCliente(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', values.phone)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Cliente no encontrado",
            description: "No se encontró ningún cliente con ese número de teléfono",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else if (data) {
        setClienteEncontrado(data);
        // Pre-llenar el formulario de nuevo cliente por si quieren editar
        nuevoClienteForm.setValue('name', data.name);
        nuevoClienteForm.setValue('phone', data.phone || '');
        nuevoClienteForm.setValue('email', data.email || '');
        nuevoClienteForm.setValue('address', data.address || '');
        // Pasar a detalles de orden
        setStep('detalles_orden');
      }
    } catch (error) {
      console.error('Error al buscar cliente:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al buscar el cliente",
        variant: "destructive"
      });
    } finally {
      setBuscandoCliente(false);
    }
  };

  // Registrar nuevo cliente
  const handleNuevoCliente = async (values: NuevoClienteValues) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: values.name.trim(),
          phone: values.phone,
          email: values.email || null,
          address: values.address || null
        })
        .select()
        .single();

      if (error) throw error;

      setClienteEncontrado(data);
      toast({
        title: "Cliente registrado",
        description: "El cliente se ha registrado correctamente"
      });
      setStep('detalles_orden');
    } catch (error) {
      console.error('Error al registrar cliente:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar el cliente",
        variant: "destructive"
      });
    }
  };

  // Crear nueva orden
  const handleCrearOrden = async (values: OrdenValues) => {
    if (!clienteEncontrado) {
      toast({
        title: "Error",
        description: "No se ha seleccionado un cliente",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: clienteEncontrado.id,
          delivery_format: values.delivery_format,
          total_price: values.total_price,
          advance_payment: values.advance_payment || 0,
          comments: values.comments
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Orden creada",
        description: `Orden ${data.folio} creada exitosamente`
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error al crear orden:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la orden",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 'buscar_cliente' && "Buscar Cliente"}
            {step === 'nuevo_cliente' && "Registrar Nuevo Cliente"}
            {step === 'detalles_orden' && "Detalles de la Orden"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Buscar Cliente */}
        {step === 'buscar_cliente' && (
          <div className="space-y-6">
            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(handleBuscarCliente)} className="space-y-4">
                <FormField
                  control={searchForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Teléfono</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <Input placeholder="Ej. 442-123-4567" {...field} />
                        </FormControl>
                        <Button type="submit" disabled={buscandoCliente}>
                          {buscandoCliente ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="cliente-nuevo" 
                checked={isClienteNuevo}
                onCheckedChange={(checked) => {
                  setIsClienteNuevo(!!checked);
                  if (checked) {
                    setStep('nuevo_cliente');
                  }
                }}
              />
              <label
                htmlFor="cliente-nuevo"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Cliente Nuevo
              </label>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Nuevo Cliente */}
        {step === 'nuevo_cliente' && (
          <div className="space-y-6">
            <Form {...nuevoClienteForm}>
              <form onSubmit={nuevoClienteForm.handleSubmit(handleNuevoCliente)} className="space-y-4">
                <FormField
                  control={nuevoClienteForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={nuevoClienteForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. 442-123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={nuevoClienteForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={nuevoClienteForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Dirección del cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setStep('buscar_cliente');
                      setIsClienteNuevo(false);
                    }}
                  >
                    Atrás
                  </Button>
                  <Button type="submit">Continuar</Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Step 3: Detalles de la Orden */}
        {step === 'detalles_orden' && clienteEncontrado && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700">Cliente</h3>
              <p className="text-sm text-gray-600">{clienteEncontrado.name}</p>
              <p className="text-sm text-gray-600">{clienteEncontrado.phone}</p>
              {clienteEncontrado.email && <p className="text-sm text-gray-600">{clienteEncontrado.email}</p>}
            </div>

            <Form {...ordenForm}>
              <form onSubmit={ordenForm.handleSubmit(handleCrearOrden)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={ordenForm.control}
                    name="delivery_format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formato de Entrega</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            {...field}
                          >
                            <option value="impresa">Impresa</option>
                            <option value="digital">Digital</option>
                            <option value="ambos">Ambos</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ordenForm.control}
                    name="total_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Total</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={ordenForm.control}
                  name="advance_payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anticipo (opcional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ordenForm.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentarios (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Comentarios adicionales" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      if (isClienteNuevo) {
                        setStep('nuevo_cliente');
                      } else {
                        setStep('buscar_cliente');
                      }
                    }}
                  >
                    Atrás
                  </Button>
                  <Button type="submit">Crear Orden</Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NuevaOrdenDialog;
