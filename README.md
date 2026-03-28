# BarLink 🍺

Application web permettant aux clients d'un bar de s'envoyer des invitations entre tables via QR codes. Aucune installation requise — tout fonctionne dans le navigateur.

---

## Stack

| Couche    | Techno                          |
|-----------|---------------------------------|
| Frontend  | React 18 + Vite + TailwindCSS   |
| Backend   | Node.js + Express + Socket.io   |
| Données   | En mémoire (sessions éphémères) |

---

## Lancement en local

### Prérequis
- Node.js ≥ 18

### Backend
```bash
cd backend
npm install
npm run dev        # port 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # port 5173
```

### Tester
Ouvrir plusieurs onglets sur :
```
http://localhost:5173/table/monbar/1
http://localhost:5173/table/monbar/2
```

---

## Structure des URLs

```
/table/:barId/:tableId
```

- **barId** : identifiant du bar (ex: `lecoq`, `barbarbar`)
- **tableId** : numéro ou identifiant de la table (ex: `1`, `vip`, `terrasse-3`)

Chaque QR code imprimé sur une table pointe vers son URL unique.

---

## Déploiement

### Backend → Railway

1. Créer un compte sur [railway.app](https://railway.app)
2. **New Project** → Deploy from GitHub → sélectionner ce dépôt
3. Définir le **Root Directory** : `backend`
4. Railway détecte Node.js automatiquement et exécute `npm start`
5. Dans **Variables** (Settings > Variables) :
   ```
   CLIENT_URL=https://votre-frontend.vercel.app
   PORT=3001
   ```
6. Récupérer l'URL publique Railway (ex: `https://barlink-backend.up.railway.app`)

### Frontend → Vercel

1. Créer un compte sur [vercel.com](https://vercel.com)
2. **New Project** → Import depuis GitHub
3. **Root Directory** : `frontend`
4. **Build Command** : `npm run build`
5. **Output Directory** : `dist`
6. Dans **Environment Variables** :
   ```
   VITE_BACKEND_URL=https://barlink-backend.up.railway.app
   ```
7. **Deploy** → récupérer l'URL Vercel

> Le fichier `frontend/vercel.json` est déjà configuré pour que React Router fonctionne correctement (toutes les URLs redirigées vers `index.html`).

### Après déploiement

Mettre à jour la variable Railway :
```
CLIENT_URL=https://votre-projet.vercel.app
```

---

## Générer les QR codes

Pour chaque table, créer un QR code pointant vers :
```
https://votre-frontend.vercel.app/table/monbar/1
https://votre-frontend.vercel.app/table/monbar/2
...
```

Outils recommandés : [qr-code-generator.com](https://www.qr-code-generator.com) ou la lib `qrcode` en Node.js.

---

## Architecture Socket.io

| Événement client → serveur | Payload | Description |
|----------------------------|---------|-------------|
| `join` | `{ barId, tableId, pseudo, photo }` | Rejoindre une salle bar |
| `invite:send` | `{ barId, fromTableId, fromPseudo, fromPhoto, toTableId, message }` | Envoyer une invitation |
| `invite:respond` | `{ barId, toTableId, fromTableId, respondPseudo, accepted }` | Répondre à une invitation |

| Événement serveur → client | Payload | Description |
|----------------------------|---------|-------------|
| `tables:updated` | `Table[]` | Liste des tables actives du bar |
| `invite:receive` | `{ fromTableId, fromPseudo, fromPhoto, message }` | Invitation reçue |
| `invite:response` | `{ responderId, responderPseudo, accepted }` | Réponse à notre invitation |
