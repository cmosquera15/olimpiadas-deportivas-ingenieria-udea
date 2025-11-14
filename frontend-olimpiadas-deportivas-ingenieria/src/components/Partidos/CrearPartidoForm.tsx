// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { startOfDay, format, parseISO } from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { partidosService } from '@/services/partidos.service';
import { catalogoService } from '@/services/catalogo.service';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

interface CrearPartidoFormProps {
  torneoId: number;
  onCreated?: (partidoId: number) => void;
}

const TIMEZONE = 'America/Bogota';

const NONE = '__none__';

const formSchema = z.object({
  fecha: z.date({
    required_error: "Debes seleccionar una fecha",
  }).refine(
    (date) => startOfDay(date) >= startOfDay(new Date()),
    "No se pueden programar partidos en el pasado"
  ),
  hora: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)"),
  lugarId: z.string({
    required_error: "Debes seleccionar un lugar",
  }),
  arbitroId: z.string({
    required_error: "Debes seleccionar un árbitro",
  }),
  faseId: z.string({
    required_error: "Debes seleccionar una fase",
  }),
  grupoId: z.string().optional(),
  jornadaId: z.string().optional(),
  observaciones: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CrearPartidoForm({ torneoId, onCreated }: CrearPartidoFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hora: "14:00",
      lugarId: undefined,
      arbitroId: undefined,
      faseId: undefined,
      grupoId: undefined,
      jornadaId: undefined,
      observaciones: '',
    },
  });

  const { data: lugares } = useQuery({
    queryKey: ['lugares'],
    queryFn: catalogoService.getLugares,
  });

  const { data: arbitros } = useQuery({
    queryKey: ['arbitros'],
    queryFn: async () => {
      const { usuariosService } = await import('@/services/usuarios.service');
      return usuariosService.getArbitros();
    },
  });

  const { data: fases } = useQuery({
    queryKey: ['fases'],
    queryFn: catalogoService.getFases,
  });

  const { data: grupos } = useQuery({
    queryKey: ['grupos', torneoId],
    queryFn: () => catalogoService.getGrupos(torneoId),
  });

  const { data: jornadas } = useQuery({
    queryKey: ['jornadas', torneoId],
    queryFn: () => catalogoService.getJornadas(torneoId),
  });

  // Consultar partidos existentes para validación de conflictos
  const { data: partidos } = useQuery({
    queryKey: ['partidos', torneoId],
    queryFn: () => partidosService.getPartidos({ torneoId }),
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const fecha = format(values.fecha, 'yyyy-MM-dd');
      return partidosService.createPartido({
        id_torneo: torneoId,
        fecha,
        hora: values.hora,
        id_lugar: Number(values.lugarId),
        id_usuario_arbitro: Number(values.arbitroId),
        id_fase: Number(values.faseId),
        id_grupo: values.grupoId ? Number(values.grupoId) : undefined,
        id_jornada: values.jornadaId ? Number(values.jornadaId) : undefined,
        observaciones: values.observaciones || undefined,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Partido creado',
        description: 'El partido ha sido creado exitosamente',
      });
      if (onCreated) {
        try { onCreated(data.id); } catch(e) { /* noop */ }
      }
      navigate(`/partidos/${data.id}`);
    },
    onError: (error: AxiosError) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear partido',
        description: typeof error.response?.data === 'object' && 'message' in error.response.data
          ? String(error.response.data.message)
          : 'Ocurrió un error al crear el partido',
      });
    },
  });

  const validateConflicts = (fecha: Date, hora: string, lugarId: string, arbitroId?: string) => {
    if (!partidos?.content || !fecha || !hora || !lugarId) return { valid: true };

    const fechaHora = parseISO(`${format(fecha, 'yyyy-MM-dd')}T${hora}`);

    const offset = getTimezoneOffset(TIMEZONE, fechaHora);
    const fechaHoraLocal = new Date(fechaHora.getTime() - offset);

    const conflictoLugar = partidos.content.find(partido => {
      const partidoFechaHora = parseISO(`${partido.fecha}T${partido.hora}`);
      const partidoFechaHoraLocal = new Date(partidoFechaHora.getTime() - offset);
      
      return (
        partido.lugar.id === Number(lugarId) &&
        partidoFechaHoraLocal.getTime() === fechaHoraLocal.getTime()
      );
    });

    const conflictoArbitro = arbitroId ? partidos.content.find(partido => {
      const partidoFechaHora = parseISO(`${partido.fecha}T${partido.hora}`);
      const partidoFechaHoraLocal = new Date(partidoFechaHora.getTime() - offset);
      
      return (
        partido.arbitro?.id === Number(arbitroId) &&
        partidoFechaHoraLocal.getTime() === fechaHoraLocal.getTime()
      );
    }) : null;

    if (conflictoLugar) return { valid: false, message: 'Ya existe un partido programado en este lugar y horario' };
    if (conflictoArbitro) return { valid: false, message: 'El árbitro ya tiene un partido asignado en este horario' };
    
    return { valid: true };
  };

  const onSubmit = (values: FormValues) => {
    const validation = validateConflicts(values.fecha, values.hora, values.lugarId, values.arbitroId);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Conflicto detectado',
        description: validation.message,
      });
      return;
    }

    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Fecha */}
          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < startOfDay(new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hora */}
          <FormField
            control={form.control}
            name="hora"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Lugar */}
          <FormField
            control={form.control}
            name="lugarId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lugar</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar lugar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {lugares?.map((lugar) => (
                      <SelectItem key={lugar.id} value={lugar.id.toString()}>
                        {lugar.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Árbitro */}
          <FormField
            control={form.control}
            name="arbitroId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Árbitro *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar árbitro" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {arbitros?.map((arbitro) => (
                      <SelectItem key={arbitro.id} value={arbitro.id!.toString()}>
                        {arbitro.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Fase */}
          <FormField
            control={form.control}
            name="faseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fase *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar fase" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fases?.map((fase) => (
                      <SelectItem key={fase.id} value={fase.id.toString()}>
                        {fase.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Grupo */}
          <FormField
            control={form.control}
            name="grupoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grupo (Opcional)</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(val === 'none' ? '' : val)} 
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grupo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin grupo</SelectItem>
                    {grupos?.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.id.toString()}>
                        {grupo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Jornada */}
          <FormField
            control={form.control}
            name="jornadaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jornada (Opcional)</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(val === 'none' ? '' : val)} 
                  value={field.value || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar jornada" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin jornada</SelectItem>
                    {jornadas?.map((jornada, idx) => {
                      const display = jornada.nombre?.trim() ? jornada.nombre : `Jornada ${idx + 1}`;
                      return (
                        <SelectItem key={jornada.id} value={jornada.id.toString()}>
                          {display}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Observaciones */}
        <FormField
          control={form.control}
          name="observaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones (Opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Observaciones adicionales" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Partido
        </Button>
      </form>
    </Form>
  );
}