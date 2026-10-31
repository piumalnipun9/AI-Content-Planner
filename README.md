# Postpilot: AI social media planner

Postpilot plans, writes, designs, publishes and learns from Facebook and Instagram content. One account can run several brands, one per Facebook Page.

0. **Brands.** Each brand is linked to one Facebook Page and the Instagram account connected to it. A brand has its own profile, posts, calendar, analytics, strategy and autopilot. A single Facebook login covers all your Pages. The scheduler publishes, measures and runs autopilot for every brand at the same time. Switch brands from the sidebar, or see them side by side under **All brands**.
1. **Brand profile.** You describe each business once: audience, tone, offers and visual style.
2. **Create.** Gemini writes a content plan (captions, hashtags, posting times, content pillars) and generates an image for every post.
3. **Publish.** Posts go to your Facebook Page and the linked Instagram Business account, either right away or at the scheduled time.
4. **Measure.** Reach, views, likes, comments, shares and saves are pulled back from the Graph API every few hours.
5. **Improve.** The AI strategist analyses the results (by pillar, platform, weekday and time of day) and writes a strategy. Every new plan follows that strategy and learns from your top posts.
6. **Autopilot (optional).** When it's on, the app plans and schedules each coming week by itself and refreshes the strategy weekly.
7. **Agent access (MCP).** Any MCP-capable AI agent can drive all of the above through `/api/mcp`.

## MCP server

Postpilot exposes a [Model Context Protocol](https://modelcontextprotocol.io) server at `$APP_URL/api/mcp`. It uses Streamable HTTP and is stateless.

Each request authenticates with a personal token from **Settings → Agent access**, sent as `Authorization: Bearer pp_…`. The agent acts as that user. Revoke the token to cut off access.

```bash
# Claude Code
claude mcp add --transport http postpilot https://your-app/api/mcp --header "Authorization: Bearer pp_..."
```

```json
// Cursor / VS Code / Windsurf / any mcpServers config
{ "mcpServers": { "postpilot": { "type": "http", "url": "https://your-app/api/mcp",
  "headers": { "Authorization": "Bearer pp_..." } } } }
```

For stdio-only clients, bridge with `npx -y mcp-remote https://your-app/api/mcp --header "Authorization: Bearer pp_..."`.

| Area | Tools |
|---|---|
| Brands | `list_brands`, `create_brand`, `get_brand_profile`, `update_brand_profile`, `set_autopilot`, `list_facebook_pages`, `link_brand_page` |
| Content | `create_content_plan`, `create_post`, `set_post_image`, `list_posts`, `get_post`, `update_post`, `rewrite_caption`, `regenerate_image`, `delete_post` |
| Publishing | `schedule_post`, `unschedule_post`, `publish_post_now` |
| Results | `get_analytics`, `refresh_metrics`, `get_strategy`, `run_strategy_analysis` |

Brand-level tools take an optional `brandId` (from `list_brands`), which is required once you have more than one brand. Post tools work by `postId` and use that post's brand. The tools call the same service layer as the web UI (`lib/services/posts.ts`, `lib/jobs.ts`), so the same rules apply. For example, Instagram posts can't be scheduled until their image is ready. Connecting Facebook still has to happen in a browser, because it's an OAuth login.

## Stack

- Next.js 16 (App Router, Server Actions), React 19, Tailwind 4, shadcn/ui
- PostgreSQL + Prisma 7
- Google Gemini via `@google/genai`: `gemini-3.5-flash` for text, `gemini-3.1-flash-image` for images (image models need billing enabled; the free tier allows 0 image generations)
- Meta Graph API v25: Facebook Login, Pages API, Instagram content publishing and insights
- Background jobs run in-process (`instrumentation.ts` → `lib/scheduler.ts`). `/api/cron` does the same work for serverless hosts.

## Getting started

```bash
# 1. Database
docker run -d --name content_planner_db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=content_planner -p 5434:5432 postgres:16-alpine

# 2. Config
cp .env.example .env    # fill in SESSION_SECRET, GEMINI_API_KEY, META_APP_ID, META_APP_SECRET, META_CONFIG_ID

# 3. Install, migrate, run
npm install
npm run db:deploy
npm run dev             # http://localhost:3000
```

Sign up, fill in the brand profile, then connect Facebook in **Settings**.

### Meta app setup

The Settings page shows these steps with your exact redirect URI.

1. Your Instagram account must be a **Business or Creator** account linked to your Facebook Page.
2. At [developers.facebook.com/apps](https://developers.facebook.com/apps), click **Create app**. Choose the Facebook Login for Business / Page management use case (or **Other** → **Business**).
3. Under **Facebook Login for Business → Settings**, add the Valid OAuth Redirect URI `$APP_URL/api/meta/callback`.
4. Under **Facebook Login for Business → Configurations**, create a configuration:
   - token type **User access token**
   - assets **Pages** and **Instagram accounts**
   - permissions `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `read_insights`, `business_management`, `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`

   Copy its ID into `META_CONFIG_ID`.
5. Under **App settings → Basic**, copy the App ID and App Secret into `META_APP_ID` and `META_APP_SECRET`.
6. In development mode the app works only for people with a role on it. Publishing for other businesses needs Business Verification and App Review.

### Publishing images needs a public URL

Facebook and Instagram download each image from `APP_URL/media/<file>.jpg`, so `APP_URL` must be a public HTTPS address. For local development, use a tunnel:

```bash
ngrok http 3000          # then set APP_URL="https://<id>.ngrok-free.app" and restart
```

Images are stored on disk in `storage/media/`. They are normalised to 1080×1350 JPEG, because Instagram only accepts JPEG and 4:5 is the largest feed format.

## Project layout

```
app/(auth)          login / register
app/onboarding      brand profile wizard
app/(app)           dashboard, create, posts, posts/[id], calendar, analytics, settings
app/actions         server actions (auth, brand, campaigns, posts, meta, strategy)
app/api/meta        OAuth connect + callback
app/api/cron        job runner for serverless hosts (Bearer CRON_SECRET)
app/media/[file]    public image serving for Meta
lib/ai              Gemini client, content planner, strategist
lib/meta            Graph client, OAuth, publishing, insights
lib/jobs.ts         campaign creation, image queue, publishing, metrics, strategy, autopilot
lib/analytics.ts    engagement aggregation
prisma/             schema + migrations
```

## Deploying

- **A long-running server** (VPS, Docker, Railway, Fly): run `npm run build && npm start`. The scheduler starts with the server.
- **Serverless (Vercel):** set `DISABLE_SCHEDULER=1` and call `GET /api/cron` with `Authorization: Bearer $CRON_SECRET` every 1–5 minutes. Generated images need persistent storage, so you'd swap `lib/media.ts` for S3/R2/Cloudinary.
