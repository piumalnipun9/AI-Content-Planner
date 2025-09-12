#!/usr/bin/env node

/**
 * Database Setup Script for Social Media Scheduler
 * This script helps set up the database and initial data
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Setting up Social Media Scheduler database...')

    try {
        // Check if database is accessible
        await prisma.$connect()
        console.log('✅ Database connected successfully')

        // Create a demo user if none exists
        const userCount = await prisma.user.count()

        if (userCount === 0) {
            console.log('📝 Creating demo user...')

            const hashedPassword = await bcrypt.hash('demo123456', 12)

            const demoUser = await prisma.user.create({
                data: {
                    email: 'demo@example.com',
                    name: 'Demo User',
                    password: hashedPassword,
                }
            })

            console.log('✅ Demo user created:', demoUser.email)

            // Create sample posts
            console.log('📱 Creating sample posts...')

            const samplePosts = [
                {
                    userId: demoUser.id,
                    title: 'AI Revolution in Business',
                    platform: 'LINKEDIN',
                    format: 'HORIZONTAL',
                    headline: 'How AI is Transforming Modern Business',
                    subhead: 'The future is here',
                    caption: '🚀 The AI revolution is transforming how we work, create, and innovate. From automating routine tasks to generating creative content, artificial intelligence is becoming an essential tool for modern businesses. What\'s your experience with AI in your industry? #AI #Innovation #BusinessGrowth #Technology #Future',
                    hashtags: ['#AI', '#Innovation', '#BusinessGrowth', '#Technology', '#Future'],
                    cta: 'Share your AI success story',
                    visualBrief: {
                        style: 'modern',
                        colors: ['#1877F2', '#42A5F5'],
                        imagery: 'abstract'
                    },
                    altText: 'Modern abstract visualization of AI and technology with blue gradient background',
                    status: 'PUBLISHED',
                    publishedAt: new Date('2024-01-10T10:00:00Z'),
                    scheduledAt: new Date('2024-01-10T10:00:00Z')
                },
                {
                    userId: demoUser.id,
                    title: 'Social Media Marketing Tips',
                    platform: 'INSTAGRAM',
                    format: 'SQUARE',
                    headline: '5 Social Media Marketing Secrets',
                    caption: '✨ Want to boost your social media engagement? Here are 5 proven strategies: 1️⃣ Post consistently 2️⃣ Use trending hashtags 3️⃣ Engage with your audience 4️⃣ Share behind-the-scenes content 5️⃣ Collaborate with others. Which tip will you try first? 💬 #SocialMediaMarketing #DigitalMarketing #ContentCreation #Marketing',
                    hashtags: ['#SocialMediaMarketing', '#DigitalMarketing', '#ContentCreation', '#Marketing', '#Tips'],
                    cta: 'Follow for more tips',
                    visualBrief: {
                        style: 'playful',
                        colors: ['#FF6B6B', '#4ECDC4'],
                        imagery: 'lifestyle'
                    },
                    altText: 'Colorful infographic showing 5 social media marketing tips with modern icons',
                    status: 'SCHEDULED',
                    scheduledAt: new Date('2024-01-15T14:00:00Z')
                },
                {
                    userId: demoUser.id,
                    title: 'Productivity Hack Monday',
                    platform: 'TWITTER',
                    format: 'HORIZONTAL',
                    headline: 'Monday Motivation: Time Blocking',
                    caption: '🗓️ Monday motivation: Try time blocking! Instead of a endless to-do list, assign specific time slots to tasks. This simple technique can boost your productivity by 40%. What\'s your favorite productivity hack? #ProductivityTips #TimeManagement #MondayMotivation',
                    hashtags: ['#ProductivityTips', '#TimeManagement', '#MondayMotivation'],
                    cta: 'Share your productivity tips',
                    visualBrief: {
                        style: 'minimal',
                        colors: ['#1DA1F2', '#14171A'],
                        imagery: 'geometric'
                    },
                    altText: 'Clean minimal design showing time blocking calendar with geometric patterns',
                    status: 'DRAFT'
                },
                {
                    userId: demoUser.id,
                    title: 'Team Collaboration Best Practices',
                    platform: 'FACEBOOK',
                    format: 'HORIZONTAL',
                    headline: 'Building Stronger Teams',
                    subhead: 'Remote work success strategies',
                    caption: '🤝 Remote work has changed how teams collaborate. Here are the best practices we\'ve learned: Clear communication channels, regular check-ins, shared goals, and celebrating wins together. What has worked best for your team? Share your experiences below! #RemoteWork #TeamWork #Collaboration #WorkFromHome',
                    hashtags: ['#RemoteWork', '#TeamWork', '#Collaboration', '#WorkFromHome'],
                    cta: 'Tell us about your team',
                    visualBrief: {
                        style: 'professional',
                        colors: ['#4267B2', '#898F9C'],
                        imagery: 'photography'
                    },
                    altText: 'Professional photo of diverse team collaborating remotely via video call',
                    status: 'GENERATED'
                },
                {
                    userId: demoUser.id,
                    title: 'Weekend Project Ideas',
                    platform: 'INSTAGRAM',
                    format: 'VERTICAL',
                    headline: 'Creative Weekend Projects',
                    caption: '🎨 Looking for weekend inspiration? Try these creative projects: • Learn a new skill online • Start a small garden • Organize your digital photos • Write in a journal • Create something with your hands. What\'s your favorite weekend activity? Tag a friend who needs this inspiration! #WeekendVibes #Creativity #SelfImprovement #Inspiration',
                    hashtags: ['#WeekendVibes', '#Creativity', '#SelfImprovement', '#Inspiration', '#DIY'],
                    cta: 'Tag a creative friend',
                    visualBrief: {
                        style: 'playful',
                        colors: ['#E1306C', '#F56040'],
                        imagery: 'lifestyle'
                    },
                    altText: 'Bright and colorful collage of creative weekend activities and DIY projects',
                    status: 'SCHEDULED',
                    scheduledAt: new Date('2024-01-13T12:00:00Z')
                }
            ]

            await prisma.post.createMany({
                data: samplePosts
            })

            console.log('✅ Sample posts created')

        } else {
            console.log('ℹ️ Users already exist, skipping demo data creation')
        }

        console.log('🎉 Database setup completed successfully!')
        console.log('')
        console.log('Demo credentials:')
        console.log('Email: demo@example.com')
        console.log('Password: demo123456')
        console.log('')
        console.log('Next steps:')
        console.log('1. Copy .env.example to .env and fill in your API keys')
        console.log('2. Run: npm run dev')
        console.log('3. Open: http://localhost:3000')

    } catch (error) {
        console.error('❌ Database setup failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()