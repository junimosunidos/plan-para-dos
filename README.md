# Plan para dos

Juegos para beber en pareja: **¿Cuánto sabes de mí?**, **Dilemas** y **Peaje**.

- **APK para Android:** [descargar la última versión](https://github.com/junimosunidos/plan-para-dos/releases/latest/download/plan-para-dos.apk)
- **Versión web:** https://junimosunidos.github.io/plan-para-dos/

## Cómo está organizado

- `www/` — la app (HTML, fuentes, iconos). Es lo que se publica en la web y lo que va dentro del APK.
- `android/` — proyecto Android generado con Capacitor.
- `.github/workflows/apk.yml` — en cada cambio en `main` compila el APK y lo publica en *Releases*.
- `.github/workflows/web.yml` — en cada cambio en `main` publica `www/` en GitHub Pages.

La música es original: se genera en el propio móvil con Web Audio, sin archivos de audio.

La clave de firma del APK no está en el repositorio: se guarda en los secretos del repositorio (`KEYSTORE_BASE64` y `KEYSTORE_PASSWORD`). Sin ellos, el APK se firma con una clave temporal y para actualizar hay que desinstalar la versión anterior.
