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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Search, 
  Phone, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  Image,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Esquema para la búsqueda de cliente
const clienteSearchSchema = z.object({
  country_code: z.string().default('+52'),
  phone: z.string().min(1, "El teléfono es requerido para buscar")
});

// Esquema para nuevo cliente
const nuevoClienteSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  country_code: z.string().default('+52'),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
  email: z.string().email("Ingresa un email válido").or(z.string().length(0)).optional(),
  address: z.string().optional()
});

// Esquema para la selección del servicio
const servicioSchema = z.object({
  service_id: z.string().min(1, "Selecciona un servicio")
});

// Esquema para las opciones de servicio
const opcionesServicioSchema = z.record(z.string(), z.union([z.string(), z.boolean(), z.number()]));

// Esquema para la orden
const ordenSchema = z.object({
  delivery_format: z.enum(['impresa', 'digital', 'ambos'], {
    required_error: "Selecciona un formato de entrega"
  }),
  total_price: z.coerce.number().min(1, "El precio total debe ser mayor a 0"),
  advance_payment: z.coerce.number().min(0, "El anticipo no puede ser negativo").optional(),
  comments: z.string().optional(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1").default(1)
});

// Tipos para formularios
type ClienteSearchValues = z.infer<typeof clienteSearchSchema>;
type NuevoClienteValues = z.infer<typeof nuevoClienteSchema>;
type ServicioValues = z.infer<typeof servicioSchema>;
type OpcionesServicioValues = z.infer<typeof opcionesServicioSchema>;
type OrdenValues = z.infer<typeof ordenSchema>;

// Tipo para las opciones de servicio desde la BD
interface ServiceOption {
  id: string;
  service_id: string;
  option_name: string;
  option_type: string;
  choices: Record<string, number>;
  required: boolean;
}

// Tipo para un servicio
type PhotoService = {
  id: string;
  description: string;
  type: string;
  base_price: number;
  active: boolean;
};

interface NuevaOrdenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NuevaOrdenDialog: React.FC<NuevaOrdenDialogProps> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState<'buscar_cliente' | 'nuevo_cliente' | 'seleccionar_servicio' | 'opciones_servicio' | 'detalles_orden'>('buscar_cliente');
  const [isClienteNuevo, setIsClienteNuevo] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [servicios, setServicios] = useState<PhotoService[]>([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<PhotoService | null>(null);
  const [opcionesServicio, setOpcionesServicio] = useState<ServiceOption[]>([]);
  const [calculandoPrecio, setCalculandoPrecio] = useState(false);
  const [precioBase, setPrecioBase] = useState(0);
  const [precioTotal, setPrecioTotal] = useState(0);
  const [precioAdicionales, setPrecioAdicionales] = useState(0);
  const { toast } = useToast();

  // Códigos de país para el selector
  const countryCodes = [
    { value: '+1', label: '🇺🇸 +1 (USA/Canadá)' },
    { value: '+52', label: '🇲🇽 +52 (México)' },
    { value: '+34', label: '🇪🇸 +34 (España)' },
    { value: '+57', label: '🇨🇴 +57 (Colombia)' },
    { value: '+54', label: '🇦🇷 +54 (Argentina)' },
    { value: '+56', label: '🇨🇱 +56 (Chile)' },
    { value: '+51', label: '🇵🇪 +51 (Perú)' },
  ];

  // Formulario para búsqueda de cliente
  const searchForm = useForm<ClienteSearchValues>({
    resolver: zodResolver(clienteSearchSchema),
    defaultValues: {
      country_code: '+52',
      phone: ''
    }
  });

  // Formulario para nuevo cliente
  const nuevoClienteForm = useForm<NuevoClienteValues>({
    resolver: zodResolver(nuevoClienteSchema),
    defaultValues: {
      name: '',
      country_code: '+52',
      phone: '',
      email: '',
      address: ''
    }
  });

  // Formulario para selección de servicio
  const servicioForm = useForm<ServicioValues>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      service_id: ''
    }
  });

  // Formulario para opciones de servicio
  const opcionesServicioForm = useForm<OpcionesServicioValues>({
    resolver: zodResolver(opcionesServicioSchema),
    defaultValues: {}
  });

  // Formulario para orden
  const ordenForm = useForm<OrdenValues>({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      delivery_format: 'impresa',
      total_price: 0,
      advance_payment: 0,
      comments: '',
      quantity: 1
    }
  });

  // Cargar servicios al abrir el diálogo
  useEffect(() => {
    if (open) {
      fetchServicios();
    }
  }, [open]);

  const fetchServicios = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_services')
        .select('*')
        .eq('active', true)
        .order('description');

      if (error) throw error;

      setServicios(data || []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive"
      });
    }
  };

  // Si el diálogo se cierra, resetear todo
  useEffect(() => {
    if (!open) {
      setStep('buscar_cliente');
      setIsClienteNuevo(false);
      setClienteEncontrado(null);
      setServicioSeleccionado(null);
      setOpcionesServicio([]);
      setPrecioBase(0);
      setPrecioTotal(0);
      setPrecioAdicionales(0);
      searchForm.reset();
      nuevoClienteForm.reset();
      servicioForm.reset();
      opcionesServicioForm.reset();
      ordenForm.reset();
    }
  }, [open, searchForm, nuevoClienteForm, servicioForm, opcionesServicioForm, ordenForm]);

  // Manejar cambios en opciones de servicio para recalcular precio
  useEffect(() => {
    if (servicioSeleccionado) {
      calcularPrecio();
    }
  }, [opcionesServicioForm.watch(), ordenForm.watch('quantity')]);

  // Buscar cliente por teléfono
  const handleBuscarCliente = async (values: ClienteSearchValues) => {
    setBuscandoCliente(true);
    try {
      // Formatear teléfono completo con código de país
      const fullPhone = `${values.country_code}${values.phone.replace(/\D/g, '')}`;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', fullPhone)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Cliente no encontrado",
            description: "No se encontró ningún cliente con ese número de teléfono",
            variant: "destructive"
          });
          // Pre-llenar el formulario de nuevo cliente con el teléfono
          nuevoClienteForm.setValue('country_code', values.country_code);
          nuevoClienteForm.setValue('phone', values.phone);
          setIsClienteNuevo(true);
          setStep('nuevo_cliente');
        } else {
          throw error;
        }
      } else if (data) {
        setClienteEncontrado(data);
        // Pre-llenar el formulario de nuevo cliente por si quieren editar
        nuevoClienteForm.setValue('name', data.name);
        nuevoClienteForm.setValue('phone', data.phone.replace(values.country_code, ''));
        nuevoClienteForm.setValue('country_code', values.country_code);
        nuevoClienteForm.setValue('email', data.email || '');
        nuevoClienteForm.setValue('address', data.address || '');
        // Pasar a selección de servicio
        setStep('seleccionar_servicio');
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
      // Formatear teléfono completo con código de país
      const fullPhone = `${values.country_code}${values.phone.replace(/\D/g, '')}`;

      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: values.name.trim(),
          phone: fullPhone,
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
      setStep('seleccionar_servicio');
    } catch (error) {
      console.error('Error al registrar cliente:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar el cliente",
        variant: "destructive"
      });
    }
  };

  // Seleccionar servicio
  const handleSeleccionarServicio = async (values: ServicioValues) => {
    try {
      const servicio = servicios.find(s => s.id === values.service_id);
      if (!servicio) throw new Error("Servicio no encontrado");

      setServicioSeleccionado(servicio);
      setPrecioBase(servicio.base_price);
      
      // Cargar opciones de servicio
      const { data: opciones, error } = await supabase
        .from('service_options')
        .select('*')
        .eq('service_id', values.service_id);

      if (error) throw error;

      // Convert the Supabase JSON data to the expected format
      const processedOptions = opciones?.map(option => ({
        ...option,
        choices: typeof option.choices === 'object' ? option.choices as Record<string, number> : {}
      })) || [];
      
      setOpcionesServicio(processedOptions);
      
      // Inicializar formulario de opciones con valores predeterminados
      const defaultValues: Record<string, string | boolean> = {};
      processedOptions.forEach(opcion => {
        if (opcion.option_type === 'dropdown' && opcion.choices) {
          // Para dropdowns, seleccionar la primera opción
          const firstChoice = Object.keys(opcion.choices)[0];
          defaultValues[opcion.option_name] = firstChoice;
        } else if (opcion.option_type === 'checkbox') {
          // Para checkboxes, inicializar como false
          defaultValues[opcion.option_name] = false;
        }
      });

      opcionesServicioForm.reset(defaultValues);
      setStep('opciones_servicio');
      
      // Inicializar precio total
      calcularPrecio();
    } catch (error) {
      console.error('Error al seleccionar servicio:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al seleccionar el servicio",
        variant: "destructive"
      });
    }
  };

  // Calcular precio total basado en opciones seleccionadas
  const calcularPrecio = () => {
    if (!servicioSeleccionado) return;
    
    setCalculandoPrecio(true);
    try {
      let precioAdicionalesTemp = 0;
      const valores = opcionesServicioForm.getValues();
      
      opcionesServicio.forEach(opcion => {
        const valorSeleccionado = valores[opcion.option_name];
        
        if (opcion.option_type === 'dropdown' && typeof valorSeleccionado === 'string') {
          // Para dropdowns, obtener el modificador de precio asociado
          precioAdicionalesTemp += opcion.choices[valorSeleccionado] || 0;
        } else if (opcion.option_type === 'checkbox' && valorSeleccionado === true) {
          // Para checkboxes, aplicar precio si está marcado
          precioAdicionalesTemp += opcion.choices['true'] || 0;
        }
      });
      
      setPrecioAdicionales(precioAdicionalesTemp);
      
      // Calcular precio total considerando cantidad
      const cantidad = ordenForm.getValues('quantity') || 1;
      const precioTotalCalculado = (precioBase + precioAdicionalesTemp) * cantidad;
      setPrecioTotal(precioTotalCalculado);
      ordenForm.setValue('total_price', precioTotalCalculado);
      
      // Calcular anticipo predeterminado (30%)
      const anticipoPredeterminado = Math.ceil(precioTotalCalculado * 0.3);
      ordenForm.setValue('advance_payment', anticipoPredeterminado);
    } catch (error) {
      console.error('Error al calcular precio:', error);
    } finally {
      setCalculandoPrecio(false);
    }
  };

  // Continuar a detalles de orden
  const handleOpcionesServicio = () => {
    setStep('detalles_orden');
  };

  // Crear nueva orden
  const handleCrearOrden = async (values: OrdenValues) => {
    if (!clienteEncontrado || !servicioSeleccionado) {
      toast({
        title: "Error",
        description: "Información incompleta para crear la orden",
        variant: "destructive"
      });
      return;
    }

    try {
      // Obtener opciones seleccionadas
      const opcionesSeleccionadas = opcionesServicioForm.getValues();
      
      // Insertar orden - No incluir folio ya que se genera automáticamente por un trigger
      const { data: orden, error: ordenError } = await supabase
        .from('orders')
        .insert({
          customer_id: clienteEncontrado.id,
          delivery_format: values.delivery_format,
          total_price: values.total_price,
          advance_payment: values.advance_payment || 0,
          comments: values.comments,
          remaining_payment: values.total_price - (values.advance_payment || 0)
        })
        .select()
        .single();

      if (ordenError) throw ordenError;

      // Insertar item de orden
      const { data: item, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orden.id,
          service_id: servicioSeleccionado.id,
          quantity: values.quantity,
          unit_price: precioBase,
          subtotal: values.total_price,
          selected_options: opcionesSeleccionadas
        })
        .select()
        .single();

      if (itemError) throw itemError;

      toast({
        title: "Orden creada",
        description: `Orden ${orden.folio} creada exitosamente`
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

  // Renderizar formulario de opciones de servicio dinámicamente
  const renderOpcionesServicio = () => {
    if (!opcionesServicio.length) {
      return (
        <div className="text-center py-4 text-gray-500">
          No hay opciones configuradas para este servicio
        </div>
      );
    }

    return opcionesServicio.map((opcion) => {
      if (opcion.option_type === 'dropdown') {
        return (
          <FormField
            key={opcion.id}
            control={opcionesServicioForm.control}
            name={opcion.option_name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {opcion.option_name}
                  {opcion.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <Select
                  value={field.value as string}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Seleccionar ${opcion.option_name}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(opcion.choices || {}).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {key} {value > 0 && ` (+$${value})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else if (opcion.option_type === 'checkbox') {
        return (
          <FormField
            key={opcion.id}
            control={opcionesServicioForm.control}
            name={opcion.option_name}
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value as boolean}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {opcion.option_name}
                    {opcion.required && <span className="text-red-500 ml-1">*</span>}
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {opcion.choices?.true > 0 && `Costo adicional: +$${opcion.choices.true}`}
                  </p>
                </div>
              </FormItem>
            )}
          />
        );
      }
      return null;
    });
  };

  // Formatear número como precio
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
          <DialogTitle className="text-xl">
            {step === 'buscar_cliente' && "Buscar Cliente"}
            {step === 'nuevo_cliente' && "Registrar Nuevo Cliente"}
            {step === 'seleccionar_servicio' && "Seleccionar Servicio"}
            {step === 'opciones_servicio' && "Configurar Servicio"}
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
                        <div className="w-1/3">
                          <Select
                            value={searchForm.getValues('country_code')}
                            onValueChange={(value) => searchForm.setValue('country_code', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Código" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryCodes.map((code) => (
                                <SelectItem key={code.value} value={code.value}>
                                  {code.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder="Ej. 442-123-4567" 
                              {...field} 
                              className="flex-1"
                            />
                          </FormControl>
                        </div>
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
                      <div className="flex space-x-2">
                        <div className="w-1/3">
                          <Select
                            value={nuevoClienteForm.getValues('country_code')}
                            onValueChange={(value) => nuevoClienteForm.setValue('country_code', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Código" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryCodes.map((code) => (
                                <SelectItem key={code.value} value={code.value}>
                                  {code.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <FormControl>
                            <Input placeholder="Ej. 442-123-4567" {...field} />
                          </FormControl>
                        </div>
                      </div>
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
                    <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                  </Button>
                  <Button type="submit">
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Step 3: Seleccionar Servicio */}
        {step === 'seleccionar_servicio' && clienteEncontrado && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700">Cliente</h3>
              <p className="text-sm text-gray-600">{clienteEncontrado.name}</p>
              <p className="text-sm text-gray-600">{clienteEncontrado.phone}</p>
              {clienteEncontrado.email && <p className="text-sm text-gray-600">{clienteEncontrado.email}</p>}
            </div>

            <Form {...servicioForm}>
              <form onSubmit={servicioForm.handleSubmit(handleSeleccionarServicio)} className="space-y-4">
                <FormField
                  control={servicioForm.control}
                  name="service_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servicio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar servicio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {servicios.map((servicio) => (
                            <SelectItem key={servicio.id} value={servicio.id}>
                              {servicio.description} - {formatPrice(servicio.base_price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
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
                    <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                  </Button>
                  <Button type="submit">
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Step 4: Opciones de Servicio */}
        {step === 'opciones_servicio' && servicioSeleccionado && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700">Servicio Seleccionado</h3>
              <p className="text-sm text-gray-600">{servicioSeleccionado.description}</p>
              <p className="text-sm text-gray-600">Precio base: {formatPrice(servicioSeleccionado.base_price)}</p>
            </div>

            <Form {...opcionesServicioForm}>
              <form onSubmit={opcionesServicioForm.handleSubmit(handleOpcionesServicio)} className="space-y-4">
                {renderOpcionesServicio()}

                <FormField
                  control={ordenForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          step="1" 
                          {...field} 
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value > 0) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-md bg-gray-50 p-4">
                  <h4 className="font-medium mb-2">Resumen de Precios</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Precio base:</span>
                      <span>{formatPrice(precioBase)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adicionales:</span>
                      <span>{formatPrice(precioAdicionales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cantidad:</span>
                      <span>{ordenForm.getValues('quantity') || 1}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1 mt-1">
                      <span>Total:</span>
                      <span>{calculandoPrecio ? '...' : formatPrice(precioTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('seleccionar_servicio')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                  </Button>
                  <Button type="submit">
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Step 5: Detalles de la Orden */}
        {step === 'detalles_orden' && clienteEncontrado && servicioSeleccionado && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Cliente</h3>
                <p className="text-sm text-gray-600">{clienteEncontrado.name}</p>
                <p className="text-sm text-gray-600">{clienteEncontrado.phone}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Servicio</h3>
                <p className="text-sm text-gray-600">
                  {servicioSeleccionado.description} x {ordenForm.getValues('quantity')}
                </p>
                <p className="text-sm text-gray-600">
                  {Object.entries(opcionesServicioForm.getValues()).map(([key, value]) => {
                    if (typeof value === 'boolean' && value) {
                      return <span key={key} className="inline-block mr-2">{key}, </span>;
                    } else if (typeof value === 'string') {
                      return <span key={key} className="inline-block mr-2">{key}: {value}, </span>;
                    }
                    return null;
                  })}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  Total: {formatPrice(precioTotal)}
                </p>
              </div>
            </div>

            <Form {...ordenForm}>
              <form onSubmit={ordenForm.handleSubmit(handleCrearOrden)} className="space-y-4">
                <FormField
                  control={ordenForm.control}
                  name="delivery_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formato de Entrega</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar formato de entrega" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="impresa">Impresa</SelectItem>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="ambos">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ordenForm.control}
                  name="advance_payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anticipo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="1" 
                          placeholder="0.00" 
                          {...field} 
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Recomendado: {formatPrice(precioTotal * 0.3)} (30%)
                      </p>
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
                    onClick={() => setStep('opciones_servicio')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                  </Button>
                  <Button type="submit">
                    <Check className="mr-2 h-4 w-4" /> Crear Orden
                  </Button>
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
