"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Home,
  MessageSquare,
  Calendar,
  BarChart3,
  Plus,
  Instagram,
  Facebook,
  Clock,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Recent activity and scheduled posts data
const recentActivity = [
  {
    id: 1,
    type: 'published',
    content: '🚀 Exciting news! We\'re launching our new product line next week...',
    platform: 'instagram',
    timestamp: '2 hours ago',
    engagement: { likes: 245, comments: 18 },
  },
  {
    id: 2,
    type: 'scheduled',
    content: '🌟 Monday Motivation Alert! New week, new opportunities to shine...',
    platform: 'facebook',
    timestamp: 'Tomorrow at 9:00 AM',
  },
  {
    id: 3,
    type: 'generated',
    content: '💪 FITNESS TIP #1: Stay Hydrated! Drinking enough water boosts...',
    platform: 'instagram',
    timestamp: '1 day ago',
  },
  {
    id: 4,
    type: 'published',
    content: 'Behind the scenes at our office! Our team is working hard...',
    platform: 'facebook',
    timestamp: '2 days ago',
    engagement: { likes: 156, comments: 8, shares: 24 },
  },
]

const upcomingPosts = [
  {
    id: 1,
    content: '🌟 Monday Motivation Alert! New week, new opportunities...',
    platform: 'instagram',
    scheduledTime: 'Today at 3:00 PM',
    status: 'scheduled',
  },
  {
    id: 2,
    content: '💪 FITNESS TIP #2: Proper form is everything! Focus on...',
    platform: 'facebook',
    scheduledTime: 'Tomorrow at 6:00 PM',
    status: 'scheduled',
  },
  {
    id: 3,
    content: '🎯 Weekly goal setting: What are you aiming to achieve...',
    platform: 'instagram',
    scheduledTime: 'Jan 18 at 10:00 AM',
    status: 'scheduled',
  },
]

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
}

const platformColors = {
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  facebook: "bg-blue-600",
}

const activityColors = {
  published: "bg-green-500",
  scheduled: "bg-blue-500",
  generated: "bg-primary",
  failed: "bg-red-500",
}

export default function HomePage() {
  const [connectedAccounts] = useState({
    facebook: { connected: true, username: '@yourbusiness' },
    instagram: { connected: true, username: '@yourbusiness' },
  })

  const totalEngagement = recentActivity
    .filter(activity => activity.engagement)
    .reduce((sum, activity) => {
      const engagement = activity.engagement!
      return sum + (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0)
    }, 0)

  const postsThisWeek = recentActivity.filter(activity =>
    activity.type === 'published' &&
    new Date(activity.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground flex items-center">
                Welcome back!
                <Sparkles className="h-8 w-8 ml-3 text-primary" />
              </h1>
              <p className="text-xl text-muted-foreground">
                Let's create some amazing content together
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/studio">
                <Button className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Start Creating
                </Button>
              </Link>
              <Link href="/planner">
                <Button variant="outline" className="h-12 px-6 border-border hover:bg-secondary">
                  <Calendar className="h-5 w-5 mr-2" />
                  View Calendar
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Posts This Week</p>
                  <p className="text-3xl font-bold text-foreground">{postsThisWeek}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">+12%</span>
                <span className="text-muted-foreground ml-1">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Engagement</p>
                  <p className="text-3xl font-bold text-foreground">{totalEngagement.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">+8%</span>
                <span className="text-muted-foreground ml-1">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Posts</p>
                  <p className="text-3xl font-bold text-foreground">{upcomingPosts.length}</p>
                </div>
                <div className="h-12 w-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">Next in 3 hours</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Efficiency</p>
                  <p className="text-3xl font-bold text-foreground">94%</p>
                </div>
                <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={94} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">Content generation success rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="border border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-foreground">Recent Activity</CardTitle>
                  <Link href="/planner">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connected Accounts */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground">Connected Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(connectedAccounts).map(([platform, account]) => {
                  const PlatformIcon = platformIcons[platform as keyof typeof platformIcons]
                  return (
                    <div key={platform} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${platformColors[platform as keyof typeof platformColors]}`}>
                          <PlatformIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize text-foreground">{platform}</p>
                          <p className="text-xs text-muted-foreground">{account.username}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={account.connected
                          ? "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                          : "border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                        }
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${account.connected ? "bg-green-500" : "bg-red-500"
                          }`}></div>
                        {account.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  )
                })}
                <Button variant="outline" className="w-full mt-4 border-border hover:bg-secondary" asChild>
                  <Link href="/settings">
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Accounts
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Posts */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">Upcoming Posts</CardTitle>
                  <Link href="/planner">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingPosts.map((post) => (
                  <UpcomingPostItem key={post.id} post={post} />
                ))}
                <Button variant="outline" className="w-full mt-4 border-border hover:bg-secondary" asChild>
                  <Link href="/studio">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-border hover:bg-secondary" asChild>
                  <Link href="/studio">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start border-border hover:bg-secondary" asChild>
                  <Link href="/planner">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Posts
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start border-border hover:bg-secondary" asChild>
                  <Link href="/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function PostCard({ post, showDate = false }: { post: any; showDate?: boolean }) {
  const PlatformIcon = platformIcons[post.platform as keyof typeof platformIcons]

  return (
    <Card className="border border-border bg-card shadow-sm hover:bg-secondary/50 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${platformColors[post.platform as keyof typeof platformColors]}`}>
              <PlatformIcon className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-base capitalize text-foreground">{post.platform}</span>
                <Badge className={`${getStatusColor(post.status)} font-medium px-3 py-1 border`}>{post.status}</Badge>
              </div>
              {showDate && (
                <p className="text-sm text-muted-foreground font-medium">
                  {post.scheduledDate} at {post.scheduledTime}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-secondary text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 border-border shadow-lg">
              <DropdownMenuItem className="font-medium hover:bg-secondary">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive font-medium hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm leading-relaxed mb-4 text-foreground/90">{post.content}</p>

        {post.imageUrl && (
          <div className="mb-4">
            <img
              src={post.imageUrl || "/placeholder.svg"}
              alt="Post preview"
              className="rounded-lg w-full max-w-md h-40 object-cover border border-border shadow-sm"
            />
          </div>
        )}

        {post.status === "published" && (
          <div className="flex items-center gap-6 text-sm font-medium pt-3 border-t border-border">
            <span className="flex items-center gap-2 text-red-500">
              <span>❤️</span> {post.engagement.likes}
            </span>
            <span className="flex items-center gap-2 text-blue-500">
              <span>💬</span> {post.engagement.comments}
            </span>
            <span className="flex items-center gap-2 text-green-600">
              <span>🔄</span> {post.engagement.shares}
            </span>
          </div>
        )})
      </CardContent>
    </Card>
  )
}

function ActivityItem({ activity }: { activity: any }) {
  const PlatformIcon = platformIcons[activity.platform as keyof typeof platformIcons]
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'generated':
        return <Sparkles className="h-4 w-4 text-primary" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">
        <div className={`p-2 rounded-lg ${platformColors[activity.platform as keyof typeof platformColors]}`}>
          <PlatformIcon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          {getActivityIcon()}
          <span className="text-sm font-medium capitalize text-foreground">
            {activity.type} on {activity.platform}
          </span>
          <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {activity.content}
        </p>
        {activity.engagement && (
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span className="flex items-center">
              ❤️ {activity.engagement.likes}
            </span>
            <span className="flex items-center">
              💬 {activity.engagement.comments}
            </span>
            {activity.engagement.shares && (
              <span className="flex items-center">
                🔄 {activity.engagement.shares}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function UpcomingPostItem({ post }: { post: any }) {
  const PlatformIcon = platformIcons[post.platform as keyof typeof platformIcons]

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border border-border bg-muted/30">
      <div className={`p-1.5 rounded-lg ${platformColors[post.platform as keyof typeof platformColors]}`}>
        <PlatformIcon className="h-3 w-3 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-2 mb-1">
          {post.content}
        </p>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
            {post.status}
          </Badge>
          <span className="text-xs text-muted-foreground">{post.scheduledTime}</span>
        </div>
      </div>
    </div>
  )
}
