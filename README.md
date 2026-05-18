# Inscripciones Online · Taekwondo (Vercel)

Sitio web público de inscripciones a torneos. Funciona con **Vercel** (gratis, sin tarjeta) + **MongoDB Atlas** (gratis, sin tarjeta).

---

## Deploy en Vercel (15 minutos)

Asumo que el código ya está en GitHub en `darklotustab-wq/inscripciones-taekwondo` y que ya tenés la URL de MongoDB Atlas.

Si ese repo ya tenía la versión vieja del código, vamos a **sobreescribirlo** con esta versión nueva (los pasos están abajo).

### Paso A: Subir esta versión al repo de GitHub

Si ya tenías el otro código subido, en la Terminal:

```bash
cd ~/Downloads/inscripciones-vercel  # o donde descomprimiste este zip
git init
git remote add origin git@github.com:darklotustab-wq/inscripciones-taekwondo.git
git add .
git commit -m "Versión Vercel"
git branch -M main
git push -f origin main
```

> El `-f` (force) reemplaza la versión anterior del repo. Es OK porque la versión vieja no la usabas.

Si te falla, probá:

```bash
cd ~/Downloads/inscripciones-vercel
git init
git add .
git commit -m "Versión Vercel"
git branch -M main
git remote add origin git@github.com:darklotustab-wq/inscripciones-taekwondo.git
git push -f origin main
```

### Paso B: Conectar Vercel a GitHub

1. Andá a https://vercel.com
2. Click en **Sign Up** arriba a la derecha
3. **Continue with GitHub** → autoriza acceso (no te pide tarjeta)
4. En el dashboard, click **Add New...** → **Project**
5. En la lista de tus repos, encontrá `inscripciones-taekwondo` y click **Import**

### Paso C: Configurar el proyecto

Vercel te muestra una pantalla "Configure Project". Completá:

1. **Framework Preset**: dejá "Other"
2. **Root Directory**: dejar vacío (raíz)
3. **Build and Output Settings**: dejá todo en blanco
4. **Environment Variables** (lo más importante):
   - Click en **Add**
   - Name: `MONGO_URL`
   - Value: pegá tu URL de MongoDB Atlas completa, ej:
     ```
     mongodb+srv://admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Click en **Add**

5. Click en **Deploy** abajo a la derecha

### Paso D: Esperar el primer deploy

Tarda 1-3 minutos. Cuando termine, vas a ver un mensaje "Congratulations!" con confeti, y aparece tu URL pública del tipo:

```
https://inscripciones-taekwondo.vercel.app
```

Click en **Visit** y ahí está tu sitio funcionando.

---

## Probar que funciona

1. En tu URL, andá a la landing y hacé click en **CREAR EVENTO** con un nombre cualquiera
2. Te lleva al dashboard admin con código + clave
3. Abrí el link público en otra pestaña o en el celular
4. Inscribite con datos de prueba
5. Volvé al dashboard y deberías ver la inscripción

---

## Si algo falla

### "Application error" o 500 en alguna ruta
- Andá al dashboard de Vercel → tu proyecto → **Functions** → **Logs**
- Mirá qué dice el error.

### MongoDB no conecta
- Verificá que la variable `MONGO_URL` está bien en **Settings → Environment Variables** del proyecto en Vercel
- Verificá que en MongoDB Atlas tenés `0.0.0.0/0` en **Network Access** (esto permite que Vercel se conecte)

### "Build Failed"
- Revisá los logs del build. Generalmente es un typo en el `package.json` o el `vercel.json`.

---

## Cómo redespliegan los cambios

Cada vez que hagas `git push` al repo, Vercel detecta el cambio y redepoya automáticamente. No hay que hacer nada manual.

---

## Limitaciones del plan free de Vercel

| Recurso | Límite |
|---------|--------|
| Bandwidth | 100 GB / mes |
| Function invocations | 100k / mes |
| Function duration | 10 segundos máximo |
| Function memory | 1024 MB max |

Para un torneo, esto es **muchísimo más de lo necesario**.

---

## Articulación con la app de la Mac

El endpoint `GET /api/admin/<code>/export?key=<key>` devuelve el JSON completo del evento. En una próxima iteración la app de Mac va a importar los inscriptos confirmados directamente desde acá.
