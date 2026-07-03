FROM node:20-bookworm-slim

# System dependencies:
#  - libreoffice: converts docx/xlsx/pptx/images/etc -> pdf
#  - ghostscript: compresses pdfs over the size threshold
#  - fonts-dejavu: sane default fonts so LibreOffice conversions don't look broken
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    ghostscript \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
