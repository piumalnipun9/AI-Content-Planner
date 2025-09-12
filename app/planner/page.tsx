"use client"

import { useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, Filter, Search, Instagram, Facebook, Clock, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ScheduledPost {
    id: string
    content: string
    platform: 'facebook' | 'instagram'
    scheduledDate: string
    scheduledTime: string
    status: 'scheduled' | 'published' | 'failed' | 'draft'
    hashtags: string[]
    thumbnail?: string
}

const mockPosts: ScheduledPost[] = [
    {
        id: '1',
        content: '🌟 Monday Motivation Alert! New week, new opportunities to shine! Remember: Your potential is unlimited...',
        platform: 'instagram',
        scheduledDate: '2024-01-15',
        scheduledTime: '09:00',
        status: 'scheduled',
        hashtags: ['#MondayMotivation', '#NewWeek', '#Goals'],
    },
    {
        id: '2',
        content: '💪 FITNESS TIP #1: Stay Hydrated! Drinking enough water boosts your energy, improves performance...',
        platform: 'facebook',
        scheduledDate: '2024-01-17',
        scheduledTime: '18:00',
        status: 'scheduled',
        hashtags: ['#FitnessTips', '#Hydration', '#HealthyLiving'],
    },
    {
        id: '3',
        content: '🚀 Exciting news! We\'re launching our new product line next week. Stay tuned for amazing updates!',
        platform: 'instagram',
        scheduledDate: '2024-01-16',
        scheduledTime: '14:30',
        status: 'published',
        hashtags: ['#ProductLaunch', '#Innovation'],
    },
    {
        id: '4',
        content: 'Behind the scenes at our office! Our team is working hard to bring you the best experience.',
        platform: 'facebook',
        scheduledDate: '2024-01-18',
        scheduledTime: '12:00',
        status: 'draft',
        hashtags: ['#TeamWork', '#BehindTheScenes'],
    },
]

const platformColors = {
    instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
    facebook: 'bg-blue-600',
}

const statusColors = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    published: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    failed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    draft: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
}

export default function ContentPlanner() {
    const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15)) // January 15, 2024
    const [selectedDate, setSelectedDate] = useState('2024-01-15')
    const [searchTerm, setSearchTerm] = useState('')
    const [platformFilter, setPlatformFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    const getPostsForDate = (dateString: string) => {
        return mockPosts.filter(post => {
            const matchesDate = post.scheduledDate === dateString
            const matchesSearch = searchTerm === '' || post.content.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter
            const matchesStatus = statusFilter === 'all' || post.status === statusFilter

            return matchesDate && matchesSearch && matchesPlatform && matchesStatus
        })
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
            return newDate
        })
    }

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate)
        const firstDay = getFirstDayOfMonth(currentDate)
        const days = []

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-20 p-2"></div>)
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayPosts = getPostsForDate(dateString)
            const isSelected = selectedDate === dateString
            const isToday = dateString === new Date().toISOString().split('T')[0]

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(dateString)}
                    className={`h-20 p-2 border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 ${isSelected
                            ? 'bg-primary/10 border-primary'
                            : isToday
                                ? 'bg-accent/10 border-accent'
                                : 'bg-card hover:bg-muted/30'
                        }`}
                >
                    <div className={`text-sm font-medium mb-1 ${isSelected ? 'text-primary' : isToday ? 'text-accent' : 'text-foreground'}`}>
                        {day}
                    </div>
                    <div className="space-y-1">
                        {dayPosts.slice(0, 2).map((post, index) => (
                            <div
                                key={post.id}
                                className={`w-full h-2 rounded-sm ${platformColors[post.platform]}`}
                                title={`${post.platform}: ${post.content.slice(0, 50)}...`}
                            />
                        ))}
                        {dayPosts.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{dayPosts.length - 2} more</div>
                        )}
                    </div>
                </div>
            )
        }

        return days
    }

    const filteredPosts = mockPosts.filter(post => {
        const matchesSearch = searchTerm === '' || post.content.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter
        const matchesStatus = statusFilter === 'all' || post.status === statusFilter
        return matchesSearch && matchesPlatform && matchesStatus
    })

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-semibold text-foreground">Content Planner</h1>
                            <p className="text-muted-foreground">Visual overview of your scheduled content</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <Input
                                    placeholder="Search posts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-64"
                                />
                                <Button variant="outline" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                            <Select value={platformFilter} onValueChange={setPlatformFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Platforms</SelectItem>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Calendar */}
                    <div className="xl:col-span-3">
                        <Card className="border border-border bg-card">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        {formatDate(currentDate)}
                                    </CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {renderCalendarDays()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Posts for Selected Date */}
                    <div className="xl:col-span-1">
                        <Card className="border border-border bg-card">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    Posts for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {getPostsForDate(selectedDate).length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" />
                                            <p className="text-sm">No posts scheduled for this date</p>
                                        </div>
                                    ) : (
                                        getPostsForDate(selectedDate).map((post) => (
                                            <PostCard key={post.id} post={post} compact />
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card className="border border-border bg-card mt-6">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-foreground">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Scheduled</span>
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
                                        {mockPosts.filter(p => p.status === 'scheduled').length}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Published Today</span>
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300">
                                        {mockPosts.filter(p => p.status === 'published' && p.scheduledDate === new Date().toISOString().split('T')[0]).length}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Drafts</span>
                                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300">
                                        {mockPosts.filter(p => p.status === 'draft').length}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Week</span>
                                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300">
                                        {mockPosts.filter(p => {
                                            const postDate = new Date(p.scheduledDate)
                                            const today = new Date()
                                            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                                            return postDate >= today && postDate <= weekFromNow
                                        }).length}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* All Posts List */}
                <div className="mt-8">
                    <Card className="border border-border bg-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-semibold text-foreground">All Scheduled Posts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredPosts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                                {filteredPosts.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Calendar className="h-16 w-16 mx-auto mb-4 opacity-40" />
                                        <h3 className="text-lg font-medium mb-2">No posts found</h3>
                                        <p className="text-sm">Try adjusting your search or filters</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function PostCard({ post, compact = false }: { post: ScheduledPost; compact?: boolean }) {
    const PlatformIcon = post.platform === 'instagram' ? Instagram : Facebook

    return (
        <Card className={`border border-border bg-muted/30 hover:bg-muted/50 transition-all duration-200 ${compact ? '' : 'hover:shadow-md'}`}>
            <CardContent className={compact ? "p-3" : "p-4"}>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${platformColors[post.platform]}`}>
                            <PlatformIcon className="h-3 w-3 text-white" />
                        </div>
                        <span className={`font-medium capitalize ${compact ? 'text-xs' : 'text-sm'}`}>{post.platform}</span>
                        <Badge className={`${statusColors[post.status]} font-medium px-2 py-0.5 border ${compact ? 'text-xs' : ''}`}>
                            {post.status}
                        </Badge>
                    </div>
                    {!compact && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <p className={`leading-relaxed mb-3 line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {post.content}
                </p>

                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {post.hashtags.slice(0, compact ? 2 : 4).map((tag, index) => (
                            <Badge key={index} variant="secondary" className={`bg-primary/10 text-primary ${compact ? 'text-xs' : ''}`}>
                                {tag}
                            </Badge>
                        ))}
                        {post.hashtags.length > (compact ? 2 : 4) && (
                            <Badge variant="secondary" className={`bg-muted text-muted-foreground ${compact ? 'text-xs' : ''}`}>
                                +{post.hashtags.length - (compact ? 2 : 4)}
                            </Badge>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <Clock className={compact ? "h-3 w-3" : "h-4 w-4"} />
                        <span className={compact ? "text-xs" : "text-sm"}>
                            {new Date(post.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {post.scheduledTime}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}