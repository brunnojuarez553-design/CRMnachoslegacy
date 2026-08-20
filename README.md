# Nacho's Legacy Garage OS — GitHub Ready Demo

Esta carpeta está preparada para subir directamente a GitHub y desplegar en Vercel.

## ÚNICO PASO EN VERCEL PARA ACTIVAR LEGACY INTELLIGENCE

En Vercel abrí:

**Project → Settings → Environment Variables**

Creá exactamente esta variable:

```text
GROQ_API_KEY
```

Pegá como valor tu API key de Groq y activala para **Production, Preview y Development**.

Después hacé **Redeploy**.

## Qué funciona sin ninguna otra key

- Dashboard completo.
- Menú prioritario del taller.
- EN / ES.
- Leads, Customers, Vehicles, Estimates, Repair Board, Communication Center, Calendar y Growth.
- Collision Center con casos de demostración abribles.
- Fichas con información completa del cliente y vehículo.
- Selector de avances del vehículo.
- Vista previa editable del SMS.
- Simulación profesional de “Confirm progress & send SMS” en modo demo.
- Historial visual de avances.
- Exportaciones CSV.
- Legacy Intelligence con respuestas fallback incluso si Groq todavía no está configurado.

## Qué activa GROQ_API_KEY

El botón **Legacy Intelligence** pasa de respuestas de respaldo a respuestas generadas en vivo por Groq.

## Integraciones reales para una segunda etapa

Supabase, Twilio SMS e Instagram están preparadas en el código, pero son opcionales para la presentación. Sus variables están documentadas en `.env.example`.

## Deploy

1. Subir todo el contenido de esta carpeta al repositorio de GitHub.
2. Importar el repositorio en Vercel.
3. Agregar `GROQ_API_KEY`.
4. Deploy / Redeploy.

No hace falta subir `.env.local` ni ninguna API key a GitHub.
