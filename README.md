# Nacho's Legacy Collision OS

CRM de producción: consultas de la web, clientes, vehículos, casos, presupuestos, agenda, tablero de reparación, llamadas, bandeja de mensajes, métricas de origen y exportaciones CSV. La interfaz EN/ES se conserva. Las métricas se calculan con los registros reales; una base vacía muestra estados vacíos, no clientes ni ingresos de ejemplo.

## Activación sin Twilio

1. Usar **el proyecto Supabase de Nacho**, no el de Infotech ni otra aplicación. Aplicar las migraciones con `npm run supabase:setup` (requiere `SUPABASE_PROJECT_REF` y login CLI). Como alternativa, ejecutar `supabase/schema.sql` en el SQL Editor: es una instalación/actualización aditiva. No borra usuarios, clientes o casos.
2. Crear la cuenta de Nacho desde Supabase Authentication. Ejecutar `supabase/assign-owner.sql` después de reemplazar el email por el usuario exacto. Solo esa cuenta obtiene acceso al taller; no se habilita registro público automático.
3. Configurar en Vercel del **CRM**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, `NACHOS_COMPANY_SLUG=nachos-legacy`, `INTAKE_SHARED_SECRET`. Nunca usar prefijo `NEXT_PUBLIC_` para la service role ni para el secreto de recepción.
4. En Vercel de la **web pública** (`brunnojuarez553-design/Nacholegacy`), configurar `CRM_INTAKE_URL=https://crmnachoslegacy.vercel.app/api/intake/nachos` y `INTAKE_SHARED_SECRET` con el mismo valor del CRM. Generar el secreto con `openssl rand -hex 32`, guardarlo en ambos proyectos y no subirlo a GitHub. Confirmar el dominio del CRM antes de usar esa URL.
5. Si se habilitan fotos, configurar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` en el servidor de la web pública. El navegador sube imágenes directamente mediante una firma temporal, evitando el límite de tamaño de las funciones. Aplicar límites de formatos/tamaño en Cloudinary para el flujo firmado. Las fotos son opcionales; hasta 10 por consulta, 8 MB por archivo en la interfaz. Los enlaces Cloudinary son públicos: solo pedir fotos del daño, no documentación sensible.
6. Redeploy de ambos proyectos **después** de completar la base y las variables. Verificar una consulta controlada EN/ES desde formulario y asistente: debe aparecer en dashboard, consultas, caso, cliente, vehículo y bandeja web. Probar una actualización de estado con SMS desactivado y un presupuesto/turno asociado al mismo caso.

Si falta la base o hay errores, la aplicación informa el fallo. Nunca confirma una consulta que no se guardó ni cambia a datos de demo silenciosamente. Mientras se completa la configuración, los accesos de llamada/SMS de la web siguen disponibles.

## Integración de consultas

La web usa un proxy de servidor para que el secreto no llegue al navegador. La creación del caso es una transacción: cliente + vehículo + caso + fotos + consulta + conversación + mensaje se guardan juntos. El identificador de envío permite reintentar sin duplicar registros. Cliente y vehículo se reutilizan cuando coinciden. Los números de casos no dependen de un reloj con seis dígitos.

Los envíos del formulario y las consultas del asistente confirmadas por el visitante se guardan en el CRM. Abrir un enlace de llamada o SMS/iMessage no permite leer el contenido de esa comunicación desde la web: se registra manualmente hasta conectar el número/proveedor. Instagram y WhatsApp requieren su configuración separada; no se muestran como conectados si no existe esa integración.

## Twilio (última etapa)

Sin credenciales, la opción de enviar SMS permanece desactivada y el avance se puede guardar normalmente. No se simulan mensajes enviados.

Cuando se configure Twilio: agregar `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WEBHOOK_URL` y `TWILIO_STATUS_CALLBACK_URL` del `.env.example`; apuntar los webhooks al dominio exacto, incluido protocolo, barra final y query si los hubiera. El backend valida firma y cuenta, procesa mensajes entrantes sin duplicarlos y registra estados de entrega. Asociar el número a `channel_connections` mediante la administración de Supabase con el company_id de Nacho. El número usado debe poder recibir los mensajes destinados al taller; conectar otro número no sincroniza automáticamente sus iMessages personales.

El flujo distingue solicitudes aceptadas/queued, enviadas, entregadas y fallidas. No reintentar un SMS automáticamente ante una respuesta incierta del proveedor. Revisar Twilio antes de reenviar. La creación del avance y su historial se guarda primero en una transacción; un fallo de SMS no pierde el trabajo del taller.

## Permisos y datos

Cada acceso interno verifica usuario y pertenencia al taller. Las consultas API y las políticas RLS filtran por empresa. Las credenciales de canales y los eventos de webhook no son visibles para usuarios públicos o clientes del navegador. Las funciones públicas de recepción solo son ejecutables por service_role; las de avance exigen pertenencia al taller.

La agenda se carga en la zona horaria del dispositivo del operador y se muestra en la zona del taller (America/New_York). Presupuestos y métricas monetarias están en USD; presupuestos aceptados no equivalen a cobros. Los SMS, llamadas e Instagram requieren integración; los cambios nuevos fuera de estos módulos se cotizan/desarrollan aparte.

## Verificación

```bash
npm ci
npm run lint
npm test
npm run build
```

Las pruebas ejecutan las migraciones en PostgreSQL embebido y verifican transacciones, rollback, reintentos, aislamiento de empresas, permisos y SMS entrantes. También prueban campos de intake, firmas y flujos interactivos de registros vacíos, edición de clientes y guardado de avances sin Twilio. Las pruebas no envían mensajes ni modifican la base de producción.

El endpoint web incorpora una limitación básica por instancia. Para tráfico abierto elevado, configurar protección/rate limiting persistente en el hosting. Las pruebas locales no sustituyen la verificación en el Supabase y Vercel reales de Nacho.
