#!/bin/bash
echo "Limpiando caché de Tailwind..."
rm -rf node_modules/.vite
echo "Reconstruyendo CSS de Tailwind..."
npx tailwindcss -i ./src/index.css -o ./src/tailwind.output.css --minify
echo "Hecho! Ahora puedes ejecutar npm run dev"
