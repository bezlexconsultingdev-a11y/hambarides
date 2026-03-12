# Deploy Admin Dashboard to Vercel

## 1. Push this project to GitHub

From your machine (PowerShell in project root):

```powershell
cd c:\Users\donal\hambarides

# If this folder is not yet a git repo:
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub (github.com → New repository), then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

To deploy **only** the admin dashboard (recommended), use a separate repo:

```powershell
cd c:\Users\donal\hambarides\admin-dashboard
git init
git add .
git commit -m "Initial commit"
# Create repo on GitHub named e.g. hambarides-admin
git remote add origin https://github.com/YOUR_USERNAME/hambarides-admin.git
git branch -M main
git push -u origin main
```

## 2. Connect Vercel to GitHub

1. Sign in at [vercel.com](https://vercel.com) (with GitHub).
2. **Add New…** → **Project** → **Import Git Repository**.
3. Select your repo (e.g. `hambarides-admin`).
4. **Root Directory**: leave default, or set to `admin-dashboard` if you imported the whole `hambarides` repo.
5. **Framework Preset**: Vite (auto-detected).
6. **Environment Variables** (important):
   - `VITE_API_BASE` = your backend API base URL, e.g.:
     - Local/testing: `http://localhost:5000/api`
     - Production: `https://your-backend.onrender.com/api` (or whatever URL your backend uses)
7. Click **Deploy**.

## 3. After deploy

- Your admin will be at `https://your-project.vercel.app`.
- To use a custom domain: Project → **Settings** → **Domains**.

## Giving someone else access (e.g. push access)

- **GitHub**: Add them as a collaborator (repo → **Settings** → **Collaborators**), or give them access via a team.
- **Vercel**: Add them to the project (Project → **Settings** → **Team** / **Members**). They can’t push code from your machine; they use their own GitHub access and push from their clone.

**Note:** Cursor/AI assistants cannot log into your GitHub or Vercel. You run `git push` and connect the repo in Vercel yourself; the assistant can only suggest commands and config.
