# DigitalOcean Droplet Deployment

This project already includes a GitHub Actions deployment workflow in
[`/.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

The flow is:

1. Push to `main`
2. GitHub Actions connects to your droplet over SSH
3. The droplet pulls the latest repo changes
4. Docker Compose rebuilds and restarts the app

## 1. Prepare the droplet

Use Ubuntu on your droplet, then SSH in and run:

```bash
sudo apt-get update
sudo apt-get install -y git curl
REPO_URL=git@github.com:YOUR_ORG/YOUR_REPO.git \
bash scripts/deploy/bootstrap-droplet.sh
```

If you have not copied the repo to the server yet, you can also run the script
directly after cloning this repo or copy just the script up first.

## 2. Clone the repo on the server

Recommended path:

```bash
sudo mkdir -p /opt
sudo chown -R "$USER:$USER" /opt
git clone git@github.com:YOUR_ORG/YOUR_REPO.git /opt/atlas-cmms
cd /opt/atlas-cmms
```

## 3. Create the production env file

Create:

```bash
/opt/atlas-cmms/.env.production
```

Minimum example:

```dotenv
POSTGRES_USER=rootUser
POSTGRES_PWD=change-this-password
MINIO_USER=minio
MINIO_PASSWORD=change-this-password
JWT_SECRET_KEY=replace-with-a-base64-secret
PUBLIC_FRONT_URL=https://your-domain.com
PUBLIC_API_URL=https://api.your-domain.com
PUBLIC_MINIO_ENDPOINT=https://files.your-domain.com
LOGO_PATHS={"dark":"logomain.png","white":"logobanner.png"}
```

Generate a JWT secret with:

```bash
openssl rand -base64 32
```

## 4. Add runtime assets

If you use custom logos:

```bash
mkdir -p /opt/atlas-cmms/logos
```

Put your files there, for example:

- `logomain.png`
- `logobanner.png`

## 5. First manual deploy

Run this once on the droplet:

```bash
cd /opt/atlas-cmms
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.production.yml up -d --build
```

## 6. Configure GitHub Actions

In your GitHub repository settings:

### Secrets

- `VPS_HOST`: droplet IP or hostname
- `VPS_USER`: SSH user on the droplet
- `VPS_SSH_KEY`: private key matching the droplet's authorized key
- `VPS_PORT`: usually `22`

### Variables

- `DEPLOY_PATH`: `/opt/atlas-cmms`
- `DEPLOY_ENV_FILE`: `.env.production`

## 7. Auto-update behavior

After that, every push to `main` will:

1. SSH into the droplet
2. `git pull --ff-only origin main`
3. Rebuild the Docker services
4. Restart containers with the latest code

## 8. DNS and reverse proxy

If you want a proper public deployment, put Nginx or Caddy in front of the app
and terminate TLS there. Point your DNS records at the droplet first.

## 9. Useful commands on the droplet

Check running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f api
docker compose logs -f frontend
```

Manual redeploy:

```bash
git pull --ff-only origin main
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.production.yml up -d --build
```
