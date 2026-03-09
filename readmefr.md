# 🤖 ARIA Chatbot - IA Conversationnelle Intelligente

Une plateforme de chatbot moderne et prête pour la production, conçue avec **React**, **Flask**, **Rasa NLU**, **LangChain** et **Google Gemini** pour des réponses conversationnelles intelligentes.

![Status](https://img.shields.io/badge/Status-MVP-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)
![Node](https://img.shields.io/badge/Node-18+-green?logo=node.js)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)

---

## 📋 Navigation Rapide

| Document | Objectif |
|----------|---------|
| 🚀 [QUICKSTART.md](./QUICKSTART.md) | **Installation et démarrage en 5 minutes** |
| 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) | Conception du système, flux de données, décisions |
| 📁 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Organisation des répertoires et aperçu du code |
| 💻 [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | Normes de code, tests, bonnes pratiques |
| 📡 [aria-backend/README.md](./aria-backend/README.md) | Points de terminaison API et documentation backend |

---

## ✨ Fonctionnalités

### 💬 Interface de Chat Intelligente
- **Messagerie en temps réel** avec indicateurs de saisie
- **Historique du chat** persistant dans localStorage
- **Design réactif** (mobile, tablette, bureau)
- **Défilement automatique** vers les messages les plus récents

### 🧠 Pipeline NLP Avancé
- **Rasa NLU** - Classification d'intentions (local, sans API)
- **LangChain** - Génération Augmentée par Récupération (RAG)
- **Google Gemini API** - LLM avancé (niveau gratuit disponible)
- **FAISS** - Recherche de similarité vectorielle
- **Logique de secours** - Rasa → LangChain → Gemini

### 📊 Gestion des Sessions
- Stockage par conversation avec identifiants uniques
- Comptage de tokens pour le suivi d'utilisation
- Suivi d'intention avec scores de confiance
- Historique des messages avec métadonnées

---

## 🚀 Démarrage Rapide

```bash
# 1. Cloner et naviguer
git clone <repo-url>
cd finalchat

# 2. Exécuter la configuration (gère tout)
./setup.sh          # Linux/Mac
setup.bat           # Windows

# 3. Ouvrir le navigateur
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

**Le premier démarrage prend 3-5 minutes** (entraînement du modèle Rasa). ☕

📚 [Configuration Détaillée →](./QUICKSTART.md)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Frontend (React 18 + Vite)        │
│   Port: 3000                        │
└──────────────┬──────────────────────┘
               │ HTTP /chat
               ▼
┌─────────────────────────────────────┐
│   Backend API (Flask + Python)      │
│   Port: 5000                        │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────────┐
        ▼                 ▼
    ┌────────┐   ┌──────────────┐
    │ Rasa   │   │  LangChain   │
    │ NLU    │   │  + FAISS     │
    │(Local) │   │  + Gemini    │
    └────────┘   └──────────────┘
```

**Flux de Données:**
1. L'utilisateur envoie un message (React)
2. Frontend appelle POST /chat (Axios)
3. Backend traite (Flask)
4. Rasa classifie l'intention
5. LangChain récupère les documents si nécessaire
6. Google Gemini génère la réponse
7. Réponse renvoyée au frontend

📚 [Architecture Complète →](./ARCHITECTURE.md)

---

## 📁 Structure du Projet

```
finalchat/
├── frontend/                    # Interface Utilisateur React (241 lignes)
│   ├── src/App.jsx             # Composant principal
│   ├── src/components/         # Composants d'interface chat
│   └── package.json
│
├── aria-backend/                # API Flask (~1000 lignes)
│   ├── app.py                  # Application principale (6 routes)
│   ├── config.py               # Chargeur de configuration
│   ├── session_manager.py      # Stockage des sessions
│   ├── nlp_utils.py            # Traitement de texte
│   ├── langchain_module.py     # Moteur RAG + LLM
│   ├── requirements.txt        # Packages Python
│   └── .env.example
│
├── ARCHITECTURE.md              # Conception du système (2000+ lignes)
├── PROJECT_STRUCTURE.md         # Organisation du code
├── DEVELOPMENT_GUIDE.md         # Bonnes pratiques
├── QUICKSTART.md               # Instructions de configuration
└── docker-compose.yml
```

📚 [Structure Complète →](./PROJECT_STRUCTURE.md)

---

## 🛠️ Pile Technologique

| Couche | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Axios |
| **Backend** | Flask 2.3, Python 3.10, Rasa 3.x |
| **NLP** | LangChain, FAISS, Sentence-Transformers, spaCy |
| **LLM** | API Google Gemini |
| **Infrastructure** | Docker, Docker Compose |

---

## 🚀 Démarrage

### Prérequis
- Docker & Docker Compose
- Node.js 18+ & npm
- Clé API Google (gratuite sur [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey))

### Étapes

1. **Obtenir la Clé API Google**: https://aistudio.google.com/app/apikey (inscription gratuite)
2. **Cloner et Configurer**:
   ```bash
   git clone <repo-url>
   cd finalchat
   ./setup.sh
   ```
3. **Ajouter la Clé API**: Modifiez `aria-backend/.env` avec votre clé API Google
4. **Ouvrir le Navigateur**: http://localhost:3000

📚 [Guide Détaillé →](./QUICKSTART.md)

---

## 📡 Points de Terminaison API

| Méthode | Point de Terminaison | Objectif |
|--------|----------|---------|
| `GET` | `/health` | Vérification d'intégrité |
| `POST` | `/chat` | Envoyer un message (point de terminaison principal) |
| `POST` | `/chat/stream` | Réponse en flux (tokens en temps réel) |
| `POST` | `/langchain` | Appel RAG LangChain direct |
| `POST` | `/build-index` | Créer le magasin de vecteurs de documents |
| `GET` | `/session/:id` | Obtenir les statistiques de session |
| `DELETE` | `/session/:id` | Supprimer la session |

**Exemple:**
```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Bonjour!", "session_id": "user-1"}'
```

📚 [Docs API Complètes →](./aria-backend/README.md)

---

## 💻 Développement

### Qualité du Code
- ✅ Indications de type sur toutes les fonctions
- ✅ Docstrings sur les classes/fonctions
- ✅ Gestion d'erreurs complète
- ✅ Journalisation sur toutes les opérations clés

### Ajout de Fonctionnalités
1. Créer une branche de fonctionnalité: `git checkout -b feature/ma-fonctionnalite`
2. Écrire du code avec des tests
3. Suivre [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
4. Soumettre une demande de fusion

📚 [Guide de Développement →](./DEVELOPMENT_GUIDE.md)

---

## 🔒 Sécurité

### ✅ Sécurité MVP
- Secrets basés sur l'environnement (.env)
- Validation des entrées
- CORS activé pour localhost

### 🔲 Besoins de Production
- Authentification JWT
- Limitation de débit
- HTTPS/TLS
- Journalisation d'audit

📚 [Détails de Sécurité →](./DEVELOPMENT_GUIDE.md#-security-guidelines)

---

## 🐛 Dépannage

### Le backend n'est pas en cours d'exécution?
```bash
cd aria-backend
docker-compose ps
docker-compose logs flask
```

### Impossible d'accéder au backend depuis le frontend?
- Vérifier: http://localhost:5000/health
- Afficher la console du navigateur (F12) pour les erreurs
- Vérifier que les conteneurs Docker sont en cours d'exécution

### Erreurs Google Gemini API?
- Vérifier la clé API dans `.env`
- Obtenir la clé depuis: https://aistudio.google.com/app/apikey
- Vérifier les limites de débit et les quotas

📚 [Dépannage Complet →](./QUICKSTART.md#-troubleshooting)

---

## 📊 Performance

**Temps de Réponse Typiques:**
- Rasa uniquement: 50-100ms
- LangChain + FAISS: 200-500ms  
- Pipeline complet (avec Gemini): 1-3 secondes

**Utilisation des Ressources:**
- Mémoire: ~500MB
- CPU: Minimal
- Disque: ~2GB (modèles)

---

## 🎯 Roadmap

| Phase | Fonctionnalités | Statut |
|-------|----------|--------|
| **Phase 1 (Actuelle)** | Chat, historique, NLU, RAG | ✅ Complète |
| **Phase 2** | Base de données, authentification, analytics | 🔲 Planifiée |
| **Phase 3** | Multi-langue, voix, streaming | 🔲 Future |
| **Phase 4** | Ajustement fin, multimodal | 🔲 Long terme |

---

## 📚 Fichiers de Documentation

1. **[QUICKSTART.md](./QUICKSTART.md)** - Instructions de configuration (5 min setup)
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Conception du système et décisions
3. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Organisation du code
4. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Normes et bonnes pratiques
5. **[aria-backend/README.md](./aria-backend/README.md)** - Référence API
6. **[frontend/README.md](./frontend/README.md)** - Docs des composants (si existe)

---

## 🤝 Contribution

1. Forker le référentiel
2. Créer une branche de fonctionnalité
3. Suivre [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
4. Soumettre une demande de fusion

---

## 📝 Licence

Licence MIT - voir le fichier LICENSE pour les détails

---

## 🔗 Ressources

- [Documentation Rasa](https://rasa.com/docs/)
- [Documentation LangChain](https://python.langchain.com/)
- [API Google Gemini](https://ai.google.dev/)
- [Guide FAISS](https://github.com/facebookresearch/faiss)
- [Documentation React](https://react.dev/)

---

**Statut**: ✅ MVP Prêt  
**Dernière Mise à Jour**: 9 Mars 2026  
**Version**: 1.0.0
