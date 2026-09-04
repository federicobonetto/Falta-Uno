# Falta Uno — Vercel + Supabase

Aplicación completa para registrar jugadores, publicar partidos de pádel y completar equipos.

## Arquitectura

- Next.js 16 para Vercel.
- Supabase Auth para registro, confirmación de correo y sesiones.
- Supabase PostgreSQL para perfiles, partidos y participantes.
- Supabase Storage privado para fotos de perfil.

## Variables necesarias

Copiar `.env.example` como `.env.local` solamente para desarrollo local. Nunca subir `.env.local` a GitHub.

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REEMPLAZAR
SUPABASE_SECRET_KEY=sb_secret_REEMPLAZAR
```

En Vercel se cargan en `Project Settings > Environment Variables` para Production, Preview y Development.

## Despliegue

1. Subir todos los archivos a la raíz de un repositorio de GitHub.
2. Importar el repositorio desde Vercel.
3. Agregar las tres variables anteriores.
4. Ejecutar el primer deploy.
5. En Supabase, configurar `Authentication > URL Configuration`:
   - Site URL: la URL entregada por Vercel.
   - Redirect URL: `https://TU-SITIO.vercel.app/auth/callback`.
6. Volver a desplegar y probar un registro real.

## Desarrollo local

```bash
npm install
npm run dev
```

## Comprobación

```bash
npm run build
```

La base de datos y el bucket `avatars` deben configurarse en Supabase antes del primer registro. Las contraseñas de usuarios son administradas por Supabase Auth y nunca se guardan en las tablas públicas.
