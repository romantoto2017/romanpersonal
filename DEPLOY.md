# Subir la app a Netlify y ponerla en el celular

Gratis, sin tarjeta y sin servidor. Son dos partes: **subirla una vez** y después
**instalarla en el teléfono**.

---

## Parte 1 — Subirla a Netlify

### Opción A (la recomendada): conectando GitHub

Así cada vez que cambies algo y hagas `git push`, Netlify la actualiza sola.

1. **Subí el código a GitHub.** Ya está en la rama `claude/practical-bell-e83l3k`
   del repo `romantoto2017/romanpersonal`.

2. **Entrá a [app.netlify.com](https://app.netlify.com)** y creá una cuenta.
   Elegí *Sign up with GitHub* y listo, no hace falta contraseña nueva.

3. Tocá **"Add new site" → "Import an existing project"**.

4. Elegí **GitHub** y autorizá a Netlify a ver tus repos. Cuando te pregunte,
   podés darle acceso solo a `romanpersonal` en vez de a todos.

5. Elegí el repo **`romanpersonal`** de la lista.

6. En la pantalla de configuración, **fijate que la rama sea la correcta**
   (`claude/practical-bell-e83l3k`, o `main` si después la mergeás).
   El resto ya viene bien porque el repo trae un `netlify.toml`:

   | Campo | Valor |
   |---|---|
   | Build command | `npm run build` |
   | Publish directory | `dist` |

   Si algún campo aparece vacío, escribilo a mano con esos valores.

7. Tocá **"Deploy"** y esperá. Tarda uno o dos minutos.

8. Cuando termine, te va a dar una dirección tipo
   `https://algo-random-123456.netlify.app`.
   Podés cambiarla en **Site configuration → Change site name** por algo lindo,
   por ejemplo `mi-mapa-de-viajes.netlify.app`.

### Opción B: arrastrando la carpeta (30 segundos, sin GitHub)

Sirve para probar rápido, pero cada actualización la tenés que volver a arrastrar.

1. En tu compu, dentro de la carpeta del proyecto, corré:

   ```bash
   npm install
   npm run build
   ```

   Eso te crea una carpeta **`dist`**.

2. Entrá a [app.netlify.com/drop](https://app.netlify.com/drop).

3. **Arrastrá la carpeta `dist` entera** a la ventana del navegador.

4. Listo, te da la dirección al toque.

> ⚠️ Arrastrá la carpeta `dist`, no el `.zip` ni la carpeta del proyecto entero.

---

## Parte 2 — Instalarla en el celular

Abrí la dirección de Netlify en el celular. **Tiene que ser `https://`**
(Netlify ya te da https, así que estás bien): sin eso el celular no deja instalarla.

### Android (Chrome)

1. Abrí la dirección en **Chrome**.
2. Esperá unos segundos: abajo te va a aparecer un cartelito
   **"Instalala en tu pantalla de inicio"**. Tocá **Instalar**.
3. Si no aparece: tocá los **⋮ tres puntitos** arriba a la derecha →
   **"Agregar a la pantalla principal"** o **"Instalar aplicación"**.
4. Confirmá. Te queda el ícono del globito terracota entre tus apps.

### iPhone (Safari)

En iPhone **tiene que ser Safari**, con Chrome no funciona.

1. Abrí la dirección en **Safari**.
2. Tocá el botón **Compartir** (el cuadradito con la flecha para arriba, abajo en el medio).
3. Bajá en la lista y tocá **"Agregar a inicio"** / *"Add to Home Screen"*.
4. Tocá **Agregar** arriba a la derecha.

En los dos casos, al abrirla desde el ícono la vas a ver **sin la barra del
navegador**, como una app normal.

---

## Cosas que conviene saber

**Andá una vez con internet.** La primera vez que la abrís se descarga todo
(mapa incluido). De ahí en más funciona en modo avión, en el ómnibus o en el
avión mismo.

**Tus datos viven en ese celular.** No hay cuenta ni nube. Si borrás los datos
del navegador o desinstalás la app, se van. Por eso:

> **Hacete un backup cada tanto.** Ajustes (el ícono arriba a la derecha en el
> mapa) → **Exportar**. Te baja un `.json` que podés mandarte por mail o guardar
> en Drive. Cuando cambies de celular, instalás la app y le das **Importar**.

**Actualizaciones.** Si usaste la Opción A, con hacer `git push` alcanza: Netlify
rebuildea y la próxima vez que abras la app te aparece un cartelito
**"Hay una versión nueva"** con un botón para actualizar.

**Los datos de ejemplo.** La app arranca con seis viajes de muestra para que veas
cómo queda. Cuando quieras arrancar en limpio: **Ajustes → Borrar todo**.

---

## Si algo sale mal

| Qué pasa | Por qué suele ser |
|---|---|
| El deploy falla en Netlify | Mirá el log del deploy. Casi siempre es la versión de Node: en **Site configuration → Environment variables** agregá `NODE_VERSION` = `20`. |
| Página en blanco | Refrescá con la pestaña cerrada y vuelta a abrir. Si sigue, probá en una ventana privada para descartar un service worker viejo. |
| No aparece la opción de instalar | Fijate que sea `https://` y no `http://`, y en iPhone que estés en Safari. |
| El clima dice "sin conexión" | Las APIs necesitan internet. Sin datos te muestra lo último que guardó, que es lo esperado. |
