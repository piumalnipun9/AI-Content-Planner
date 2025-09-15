# AI Social Media Scheduler - API Keys & Integration Guide

## 📍 Where to Put Your API Keys

### 1. Environment Variables (.env file)

Create a `.env` file in your project root with your API keys:

```bash
# Copy .env.example to .env and fill in your keys
cp .env.example .env
```

**Required API Keys:**

```env
# Database
DATABASE_URL=\"postgresql://username:password@localhost:5432/social_media_scheduler\"

# Authentication
JWT_SECRET=\"your-super-secret-jwt-key-here\"

# AI Content Generation
OPENAI_API_KEY=\"sk-your-openai-api-key-here\"
GEMINI_API_KEY=\"your-gemini-api-key-here\"

# Social Media APIs
META_APP_ID=\"your-meta-app-id\"
META_APP_SECRET=\"your-meta-app-secret\"

# Design Integration
CANVA_CLIENT_ID=\"your-canva-client-id\"
CANVA_CLIENT_SECRET=\"your-canva-client-secret\"
CANVA_REDIRECT_URI=\"http://localhost:3000/api/canva/auth/callback\"
```

### 2. User-Specific API Keys (Database Storage)

Users can also store their personal API keys in the database through the UI:

- Navigate to **Settings** > **API Keys**
- Add your personal OpenAI, Gemini, or other API keys
- These keys take priority over environment variables
- Keys are stored per user and are private

## 🤖 Getting Your Gemini Flash API Key

### Step 1: Go to Google AI Studio
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account

### Step 2: Create API Key
1. Click **\"Get API Key\"** in the top navigation
2. Click **\"Create API Key\"**
3. Select your Google Cloud project (or create one)
4. Copy the generated API key

### Step 3: Add to Your Project
```bash
# Add to your .env file
GEMINI_API_KEY=\"your-gemini-api-key-here\"
```

### Step 4: Verify Integration
- Go to Content Studio
- Select \"Gemini\" as your AI provider
- Test content generation

## 🔗 Database Integration Overview

### Database Schema Structure

```sql
-- Users (Main accounts)
model User {
  id             String          @id @default(cuid())
  email          String          @unique
  name           String?
  password       String
  posts          Post[]
  apiKeys        ApiKey[]         -- User's personal API keys
  socialAccounts SocialAccount[]  -- Connected social media accounts
}

-- API Keys (Personal user keys)
model ApiKey {
  userId    String
  provider  ApiProvider  -- OPENAI, GEMINI, CANVA, META, PINECONE
  keyName   String
  keyValue  String       -- Encrypted in production
  isActive  Boolean
}

-- Social Media Accounts (Connected platforms)
model SocialAccount {
  userId       String
  platform     PostPlatform  -- INSTAGRAM, FACEBOOK, etc.
  accountId    String
  username     String
  accessToken  String        -- Encrypted OAuth tokens
  refreshToken String?
}

-- Posts (Generated/scheduled content)
model Post {
  userId      String
  platform    PostPlatform
  status      PostStatus    -- DRAFT, GENERATED, SCHEDULED, PUBLISHED
  scheduledAt DateTime?
  content     Json          -- All post data
}
```

### How Data Flows

1. **User Registration** → Creates User record
2. **API Key Setup** → Stores in ApiKey table
3. **Social Account Connection** → OAuth flow → SocialAccount table
4. **Content Generation** → Uses AI service → Creates Post record
5. **Scheduling** → Updates Post.scheduledAt
6. **Publishing** → Uses SocialAccount tokens → Updates Post.status

## 🚀 AI Service Integration

### Multi-Provider Support

The system supports multiple AI providers with automatic fallback:

```typescript
// AI Service automatically chooses the best available provider
const post = await AIService.generatePostContent({
  userId: user.id,
  prompt: \"Create a motivational Monday post\",
  platform: \"INSTAGRAM\",
  aiProvider: \"GEMINI\" // or \"OPENAI\"
})
```

### Provider Priority

1. **User's Personal Keys** (stored in database)
2. **Environment Variables** (fallback)
3. **Alternative Provider** (if primary fails)

### Supported Providers

| Provider | Models | Use Case |
|----------|--------|---------|
| **OpenAI** | GPT-4, GPT-3.5-turbo | High-quality content, brand voice |
| **Gemini** | Gemini-1.5-Flash | Fast generation, cost-effective |
| **Meta** | - | Publishing to Facebook/Instagram |
| **Canva** | - | Design generation and editing |

## 📱 Social Media Integration

### Meta (Facebook/Instagram) Setup

1. **Create Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create new app
   - Add Instagram Basic Display and Facebook Login products

2. **Get Credentials**:
   ```env
   META_APP_ID=\"your-app-id\"
   META_APP_SECRET=\"your-app-secret\"
   ```

3. **User Connection Flow**:
   - User clicks \"Connect Instagram\" in settings
   - OAuth flow → stores access tokens
   - App can now post on their behalf

### Publishing Workflow

```typescript
// 1. Generate content
const post = await AIService.generatePostContent(request)

// 2. Save to database
const savedPost = await prisma.post.create({...})

// 3. Schedule for publishing
await schedulePost(savedPost.id, scheduledTime)

// 4. Publish when time comes
await publishToSocialMedia(savedPost.id)
```

## 🔧 Setup Instructions

### 1. Database Setup
```bash
# Set up PostgreSQL database
npm run db:push

# Run initial setup (creates demo data)
npm run setup
```

### 2. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual API keys
# At minimum, you need:
# - DATABASE_URL
# - JWT_SECRET
# - Either OPENAI_API_KEY or GEMINI_API_KEY
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Application
- Open http://localhost:3000
- Register a new account or use demo credentials
- Go to Settings → API Keys to add your keys
- Start generating content!

## 🔐 Security Considerations

### Production Deployment

1. **Encrypt API Keys**: Use proper encryption for stored API keys
2. **Environment Variables**: Use secure secret management
3. **HTTPS Only**: Ensure all API communications use HTTPS
4. **Rate Limiting**: Implement proper rate limiting (already configured)
5. **Input Validation**: All inputs are validated with Zod schemas

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| API Keys | Plain text in .env | Encrypted in database |
| Database | Local PostgreSQL | Cloud PostgreSQL |
| JWT Secret | Simple string | Cryptographically secure |
| HTTPS | Optional | Required |
| Logging | Console | Structured logging |

## 🧪 Testing Your Setup

### 1. Test AI Generation
- Go to Content Studio
- Enter a prompt: \"Create a motivational Monday post for fitness enthusiasts\"
- Select platform: Instagram
- Choose AI provider: Gemini or OpenAI
- Click Generate

### 2. Test Database
- Check Posts section for generated content
- Verify content is saved properly
- Test scheduling functionality

### 3. Test API Keys Management
- Go to Settings → API Keys
- Add a test API key
- Verify it appears in the list
- Test key deletion

## 🚨 Troubleshooting

### Common Issues

1. **\"API key not found\"**
   - Check your .env file
   - Verify API key format
   - Try adding key through UI

2. **Database connection errors**
   - Verify DATABASE_URL format
   - Check PostgreSQL is running
   - Run `npm run db:push`

3. **Content generation fails**
   - Check API key validity
   - Verify provider is available
   - Check rate limits

### Debug Commands

```bash
# Check database connection
npm run db:studio

# View database schema
npx prisma db pull

# Reset database
npm run db:reset

# Check logs
tail -f .next/standalone/server.log
```

## 📚 API Documentation

### Content Generation Endpoint

```http
POST /api/content/generate
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  \"prompt\": \"Create a motivational Monday post\",
  \"platforms\": [\"INSTAGRAM\"],
  \"contentTypes\": [\"brand_awareness\"],
  \"postCount\": 1,
  \"aiProvider\": \"GEMINI\",
  \"brandTone\": [\"friendly\", \"motivational\"]
}
```

### API Keys Management

```http
# Get user's API keys
GET /api/user/api-keys

# Add new API key
POST /api/user/api-keys
{
  \"provider\": \"GEMINI\",
  \"keyName\": \"My Gemini Key\",
  \"keyValue\": \"your-api-key-here\"
}

# Delete API key
DELETE /api/user/api-keys?id=<key-id>
```

This completes the comprehensive setup guide for your AI Social Media Scheduler! 🎉"