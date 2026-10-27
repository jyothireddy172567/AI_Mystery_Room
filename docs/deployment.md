# Deployment walkthrough (Render + MongoDB Atlas)

This setup deploys the React frontend and Express API together as one Docker web service. The same-origin setup keeps the session cookie and API requests straightforward. MongoDB Atlas stores cases; Render's persistent disk stores generated image files. Render disks are a paid feature and bind a service to one instance, so review current hosting and storage pricing before creating the service.

## 1. Prepare the repository

1. Create an empty GitHub repository for this project. This workspace does not currently have a Git repository initialized. From PowerShell in the project root, run:

   ```powershell
   git init
   git add .
   git commit -m "Prepare AI Mystery Room for deployment"
   git branch -M main
   git remote add origin https://github.com/<your-name>/<your-repository>.git
   git push -u origin main
   ```

   Replace the GitHub URL with your repository URL. Do not commit `.env`; it is ignored by Git.
2. Confirm `Dockerfile`, `.dockerignore`, and `render.yaml` are at the repository root.
3. Keep `MONGODB_URI`, `GEMINI_API_KEY`, and all other secrets in the hosting dashboard, never in source control.

## 2. Create MongoDB Atlas database

1. Create an Atlas project and a database deployment.
2. Create a database user with a strong generated password. URL-encode reserved characters in the password before putting it into the MongoDB connection string.
3. In Network Access, allow the Render service to connect. For tighter access, copy the outbound CIDR ranges shown under the Render service's **Connect > Outbound** tab into Atlas. Avoid `0.0.0.0/0` for a public production deployment.
4. Copy the Atlas connection string, replace its username/password placeholders, and include the intended database name, for example `ai_mystery_room`.

## 3. Create the Render service

1. Push the latest code to GitHub.
2. In Render, choose **New > Blueprint**, connect the GitHub repository, and select its branch. Render detects the root `render.yaml` and previews the web service and its 1 GB persistent disk.
3. Review the plan and disk charges, then apply the Blueprint. The Starter compute plan and persistent disk are paid; do not remove the disk if you want generated evidence images to persist across deploys.
4. When prompted, enter `MONGODB_URI` and `GEMINI_API_KEY`. The Blueprint generates `SESSION_SECRET` for you. `NODE_ENV`, `PORT`, and `IMAGE_STORAGE_DIR` are configured in the Blueprint.
5. Wait for the Docker build and deploy to finish. Render injects the public service URL; no frontend base URL needs to be configured because the site and API share one origin.

## 4. Verify the deployment

1. Open `https://<your-service>.onrender.com/api/v1/health`. Expect `{"status":"ok"}`.
2. Open the service root URL and check that the landing page loads over HTTPS.
3. Create a fictional mystery with a valid Gemini key. Confirm the case appears in My Cases, evidence details load, and image evidence either displays its generated image or the app's labeled fallback if image generation is unavailable.
4. Submit an accusation and confirm the results screen reveals the solution only after submission.
5. In Render logs, check for MongoDB connection success and look for sanitized provider errors if Gemini generation fails. Never paste secret values into logs or issue reports.

## 5. Updating the app

Push changes to the connected branch. Render rebuilds the Docker image and deploys it. MongoDB case data and files under `/var/data` remain in their respective persistent stores. Back up Atlas data independently; the attached disk only protects generated image files.

## Troubleshooting

- **Build fails:** confirm the repo root contains the lockfile and both workspace package manifests; check the Docker build log for the first failing command.
- **Service does not become healthy:** verify `/api/v1/health` returns HTTP 200 and inspect startup logs. Production startup intentionally fails when `MONGODB_URI`, `GEMINI_API_KEY`, `SESSION_SECRET`, or `IMAGE_STORAGE_DIR` is missing.
- **MongoDB connection timeout:** verify Atlas Network Access contains the current Render outbound IP ranges and the user/password/database in the URI are correct. Render's default outbound IPs can change; update Atlas if Render reports a new range.
- **Gemini provider errors:** verify the API key is enabled for the required Gemini models and has available quota. Case generation and image generation both use the server-side Gemini key.
- **Images disappear:** verify the Render disk is attached at `/var/data`, `IMAGE_STORAGE_DIR` is `/var/data/generated`, and the service is not running on an ephemeral/free instance.
- **Cookie/session problems:** use the Render HTTPS URL and the deployed same-origin site. Do not configure a separate frontend domain without also reviewing CORS and cookie settings.
