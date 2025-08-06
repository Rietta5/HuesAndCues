# Hues and Cues - Implementación Web

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Una implementación web del juego de mesa Hues and Cues, desarrollada con React, TypeScript, Vite y Tailwind CSS.

## Propósito del Proyecto

**Este es un proyecto desarrollado con fines estrictamente académicos y de aprendizaje.**

**Nota Importante:** Este proyecto es una adaptación no oficial y no está afiliado ni respaldado por los creadores o editores originales del juego de mesa Hues and Cues.

## Características Principales

*   Interfaz de juego interactiva basada en el tablero original.
*   Gestión de jugadores y turnos.
*   Sistema de pistas y adivinanzas.
*   Cálculo de puntuaciones según las reglas del juego.
*   Uso de Tailwind CSS para estilizado rápido y moderno.
*   Desplegado en Firebase Hosting.

## Configuración del Entorno de Desarrollo

1.  **Clonar el repositorio:**
    ```bash
    git clone [URL-DEL-REPOSITORIO]
    cd hues-and-cues
    ```

2.  **Instalar dependencias:**
    Se requiere Node.js (preferiblemente versión LTS) y npm.
    ```bash
    npm install
    ```

## Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

*   `npm run dev`
    Ejecuta la aplicación en modo de desarrollo.
    Abre [http://localhost:3000](http://localhost:3000) (o el puerto que indique Vite) para verla en tu navegador.
    La página se recargará si haces ediciones.

*   `npm run build`
    Compila la aplicación para producción en la carpeta `dist/`.
    Agrupa React en modo de producción y optimiza la compilación para el mejor rendimiento.
    Este script también se encarga de copiar los activos necesarios (`tablero.webp`, `clue-words.csv`) a la carpeta `dist`.

*   `npm run preview`
    Sirve localmente la versión de producción desde la carpeta `dist/`. Útil para probar la versión final antes de desplegar.

## Despliegue

El proyecto está configurado para desplegarse en Firebase Hosting.

1.  **Compila la aplicación:** Asegúrate de que todos los cambios estén listos y ejecuta el script de compilación:
    ```bash
    npm run build
    ```
    Esto generará la carpeta `dist` con los archivos optimizados para producción.

2.  **Despliega a Firebase:** Utiliza Firebase CLI para desplegar únicamente el contenido de hosting:
    ```bash
    firebase deploy --only hosting
    ```
    *Nota: Requiere tener Firebase CLI instalado y haber iniciado sesión (`firebase login`). La CLI usará la configuración de `firebase.json` para desplegar el contenido de la carpeta `dist`.*

La configuración de Firebase se encuentra en los archivos `.firebaserc` y `firebase.json`.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## Descargo de Responsabilidad

Este software se proporciona "tal cual", sin garantía de ningún tipo, expresa o implícita. El uso de este software es bajo tu propio riesgo. El autor no se hace responsable de ningún daño o problema que pueda surgir del uso de este software.

Como proyecto académico, puede contener errores, funcionalidades incompletas o no seguir todas las mejores prácticas de producción a nivel industrial. Su propósito principal es la demostración de conceptos y el aprendizaje. 