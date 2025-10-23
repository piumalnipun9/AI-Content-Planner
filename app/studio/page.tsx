"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Instagram, Facebook, Calendar, Clock, Image, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Message {
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: Date
    attachments?: string[]
    generatedContent?: GeneratedPost
}

interface GeneratedPost {
    id: string
    platform: 'facebook' | 'instagram'
    content: string
    hashtags: string[]
    suggestedTime?: string
    visualBrief?: string
    cta?: string
}

export default function ContentStudio() {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'ai',
            content: "Hi! I'm your AI content assistant. I can help you create engaging social media posts for various platforms. Just tell me what you'd like to create!\n\n**Try saying:**\n• \"Create a motivational Monday post\"\n• \"Generate content for my fitness brand\"\n• \"Create 3 posts about productivity tips\"",
            timestamp: new Date(),
        }
    ])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Check authentication on mount
    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
            toast({
                title: "Authentication Required",
                description: "Please log in to use the Content Studio.",
                variant: "destructive"
            })
            router.push('/login')
        }
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: input,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        const currentInput = input
        setInput("")
        setIsTyping(true)

        try {
            // Get auth token
            const token = localStorage.getItem('auth_token')
            if (!token) {
                throw new Error('Please log in to generate content')
            }

            // Call the actual content generation API
            const response = await fetch('/api/content/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    postCount: 1,
                    platforms: ['INSTAGRAM'], // Default to Instagram
                    contentTypes: ['brand_awareness'],
                    prompt: currentInput,
                    brandTone: ['professional', 'friendly'],
                    aiProvider: 'GEMINI'
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate content')
            }

            if (data.posts && data.posts.length > 0) {
                const post = data.posts[0]
                const aiResponse: Message = {
                    id: Date.now().toString(),
                    type: 'ai',
                    content: "Here's the content I generated for you:",
                    timestamp: new Date(),
                    generatedContent: {
                        id: post.id,
                        platform: post.platform.toLowerCase(),
                        content: post.caption,
                        hashtags: post.hashtags,
                        suggestedTime: 'Best time for your audience',
                        visualBrief: typeof post.visualBrief === 'object' ?
                            `Style: ${post.visualBrief.style}, Colors: ${post.visualBrief.colors?.join(', ')}, Imagery: ${post.visualBrief.imagery}` :
                            post.altText,
                        cta: post.cta
                    }
                }
                setMessages(prev => [...prev, aiResponse])
            } else {
                throw new Error('No content was generated')
            }
        } catch (error: any) {
            console.error('Content generation error:', error)
            const errorResponse: Message = {
                id: Date.now().toString(),
                type: 'ai',
                content: `Sorry, I encountered an error while generating content: ${error.message}. Please make sure your API keys are configured in Settings.`,
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorResponse])
            toast({
                title: "Generation Failed",
                description: `${error.message}${error.message.includes('Authentication') ? ' Click here to login.' : ''}`,
                variant: "destructive",
                action: error.message.includes('Authentication') ? {
                    altText: "Login",
                    label: "Login",
                    onClick: () => router.push('/login')
                } : undefined
            })
        } finally {
            setIsTyping(false)
        }
    }



    const handleSchedulePost = (post: GeneratedPost) => {
        const scheduleMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: `Perfect! I've scheduled your ${post.platform} post for ${post.suggestedTime}.\n\n**Scheduled Details:**\n• Platform: ${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}\n• Time: ${post.suggestedTime}\n• Status: Scheduled\n\nYou can view and manage all your scheduled posts in the Content Planner. Want to create another post?`,
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, scheduleMessage])
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-background">
                <div className="px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Content Studio</h1>
                            <p className="text-sm text-muted-foreground">AI-powered social media content creation</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            AI Ready
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full px-6 py-6">
                    <div className="space-y-6 max-w-7xl mx-auto pb-32">
                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-4xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                                    <div className={`rounded-lg px-4 py-3 ${message.type === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card border border-border text-foreground'
                                        }`}>
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>

                                        {/* Generated Content Preview */}
                                        {message.generatedContent && (
                                            <Card className="mt-4 border border-border">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            {message.generatedContent.platform === 'instagram' ? (
                                                                <Instagram className="h-4 w-4 text-pink-500" />
                                                            ) : (
                                                                <Facebook className="h-4 w-4 text-blue-500" />
                                                            )}
                                                            <span className="text-sm font-medium capitalize text-foreground">{message.generatedContent.platform}</span>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">Generated</Badge>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="text-sm leading-relaxed text-foreground">{message.generatedContent.content}</div>

                                                        {message.generatedContent.hashtags && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {message.generatedContent.hashtags.map((tag, index) => (
                                                                    <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {message.generatedContent.visualBrief && (
                                                            <div className="p-3 bg-secondary/30 rounded-lg">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <Image className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-xs font-medium text-muted-foreground">Visual Brief</span>
                                                                </div>
                                                                <p className="text-xs text-foreground">{message.generatedContent.visualBrief}</p>
                                                            </div>
                                                        )}

                                                        {message.generatedContent.cta && (
                                                            <div className="p-3 bg-secondary/30 rounded-lg">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <Target className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-xs font-medium text-muted-foreground">Call to Action</span>
                                                                </div>
                                                                <p className="text-xs text-foreground">{message.generatedContent.cta}</p>
                                                            </div>
                                                        )}

                                                        <Separator />

                                                        <div className="flex items-center justify-between">
                                                            {message.generatedContent.suggestedTime && (
                                                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>Suggested: {message.generatedContent.suggestedTime}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex space-x-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 text-xs"
                                                                    onClick={() => {
                                                                        // Add edit functionality here
                                                                    }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 text-xs bg-primary hover:bg-primary/90"
                                                                    onClick={() => handleSchedulePost(message.generatedContent!)}
                                                                >
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    Schedule
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="max-w-4xl mr-12">
                                    <div className="bg-card border border-border rounded-lg px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">AI is thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

            {/* Fixed Input Area at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg">
                <div className="px-6 py-4">
                    <div className="max-w-7xl mx-auto space-y-3">
                        {/* Quick Suggestions */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
                                onClick={() => setInput("Create a motivational Monday post")}
                            >
                                Motivational Monday
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
                                onClick={() => setInput("Generate content for my business")}
                            >
                                Business Content
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
                                onClick={() => setInput("Create educational content about productivity")}
                            >
                                Educational Tips
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
                                onClick={() => setInput("Create behind-the-scenes content")}
                            >
                                Behind the Scenes
                            </Button>
                        </div>

                        {/* Input Row */}
                        <div className="flex items-center space-x-3">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 relative">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your content request... (e.g., 'Create a motivational post for Monday')"
                                    className="min-h-[44px] bg-background border-border focus:border-primary"
                                    disabled={isTyping}
                                />
                            </div>
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}