# Guía de Deployment - Futsal Manager

## Deployment en Replit

### Paso 1: Preparación
La aplicación ya está configurada y lista para deployment con:
- ✅ PWA manifest configurado
- ✅ Service Worker implementado
- ✅ Base de datos PostgreSQL lista
- ✅ Variables de entorno configuradas
- ✅ Scripts de build preparados

### Paso 2: Deploy
1. Ve a la pestaña "Deploy" en tu Replit
2. Conecta tu cuenta de GitHub si no lo has hecho
3. Haz clic en "Deploy" 
4. Espera a que termine el proceso de build

### Paso 3: Instalación Móvil
Una vez deployado:
1. Visita la URL de producción en Chrome/Edge móvil
2. Toca el menú (⋮) → "Instalar aplicación"
3. La app aparecerá como nativa en tu dispositivo

## Deployment Manual (Alternativo)

### Variables de Entorno Necesarias
```bash
DATABASE_URL=tu_url_postgresql
NODE_ENV=production
PORT=5000
```

### Comandos
```bash
# Build del frontend
npm run build

# Inicio en producción
npm start
```

## Estructura del Proyecto
```
futsal-manager/
├── client/          # Frontend React PWA
├── server/          # Backend Express + WebSocket
├── shared/          # Schemas compartidos
├── manifest.json    # PWA manifest
├── sw.js           # Service Worker
└── package.json    # Dependencias y scripts
```

## Características PWA
- 📱 Instalable como app nativa
- 🔄 Funcionamiento offline
- ⚡ Carga rápida con caché
- 📶 Actualizaciones en tiempo real

## Soporte Técnico
- Optimizado para Android Chrome/Edge
- Interfaz táctil responsiva
- Base de datos persistente
- Sistema de backup automático