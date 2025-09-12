"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Sparkles, Instagram, Facebook, Calendar, Clock, Image, Hash, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'ai',
            content: "👋 Hi! I'm your AI content assistant. I can help you create engaging social media posts for Facebook and Instagram. Just tell me what you'd like to create!\n\n**Try saying:**\n• \"Create a motivational Monday post\"\n• \"Generate 3 fitness tips for this week\"\n• \"Schedule a product launch announcement for tomorrow at 2PM\"",
            timestamp: new Date(),
        }
    ])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

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
        setInput("")
        setIsTyping(true)

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = generateAIResponse(input)
            setMessages(prev => [...prev, aiResponse])
            setIsTyping(false)
        }, 1500)
    }

    const generateAIResponse = (userInput: string): Message => {
        const lowerInput = userInput.toLowerCase()

        // Simple keyword-based responses for demo
        if (lowerInput.includes('motivational') || lowerInput.includes('monday')) {
            return {
                id: Date.now().toString(),
                type: 'ai',
                content: "Here's a motivational Monday post for you:",
                timestamp: new Date(),
                generatedContent: {
                    id: 'post-' + Date.now(),
                    platform: 'instagram',
                    content: "🌟 Monday Motivation Alert! 🌟\n\nNew week, new opportunities to shine! Remember:\n✨ Your potential is unlimited\n✨ Every step forward counts\n✨ Believe in your journey\n\nWhat's one goal you're crushing this week? Let us know below! 👇",
                    hashtags: ['#MondayMotivation', '#NewWeek', '#Goals', '#Mindset', '#Success'],
                    suggestedTime: 'Monday at 9:00 AM',
                    visualBrief: 'Bright, energetic image with sunrise or mountain theme. Use vibrant colors that inspire action.',
                    cta: 'Share your weekly goal in the comments!'
                }
            }
        } else if (lowerInput.includes('fitness') || lowerInput.includes('tips')) {
            return {
                id: Date.now().toString(),
                type: 'ai',
                content: "Perfect! Here are 3 fitness tip posts for the week:",
                timestamp: new Date(),
                generatedContent: {
                    id: 'post-' + Date.now(),
                    platform: 'facebook',
                    content: "💪 FITNESS TIP #1: Stay Hydrated! 💧\n\nDrinking enough water boosts your energy, improves performance, and helps recovery. Aim for at least 8 glasses a day!\n\n🔥 Pro tip: Add lemon or cucumber for extra flavor and nutrients.",
                    hashtags: ['#FitnessTips', '#Hydration', '#HealthyLiving', '#Wellness'],
                    suggestedTime: 'Wednesday at 6:00 PM',
                    visualBrief: 'Clean image with water bottle, fresh fruits, or someone drinking water after workout.',
                    cta: 'What\'s your favorite way to stay hydrated?'
                }
            }
        } else if (lowerInput.includes('schedule') || lowerInput.includes('tomorrow')) {
            return {
                id: Date.now().toString(),
                type: 'ai',
                content: "I can help you schedule that! Let me create a post and set it up for tomorrow at 2PM. What type of content would you like to create?",
                timestamp: new Date(),
            }
        } else {
            return {
                id: Date.now().toString(),
                type: 'ai',
                content: "I'd be happy to help you create content! Could you tell me more about what you'd like to create? For example:\n\n• What topic or theme?\n• Which platform (Facebook/Instagram)?\n• Any specific goals or call-to-action?\n\nThe more details you give me, the better I can tailor the content for your audience!",
                timestamp: new Date(),
            }
        }
    }

    const handleSchedulePost = (post: GeneratedPost) => {
        const scheduleMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: `✅ Perfect! I've scheduled your ${post.platform} post for ${post.suggestedTime}.\n\n📅 **Scheduled Details:**\n• Platform: ${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}\n• Time: ${post.suggestedTime}\n• Status: Scheduled\n\nYou can view and manage all your scheduled posts in the Content Planner. Want to create another post?`,
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
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto flex flex-col h-screen">
                {/* Header */}
                <div className="border-b border-border bg-card/50 backdrop-blur-sm">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-foreground">Content Studio</h1>
                                    <p className="text-sm text-muted-foreground">AI-powered social media content creation</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                                    <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                                    AI Ready
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-3xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                                    <div className={`rounded-2xl px-4 py-3 ${message.type === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card border border-border'
                                        }`}>
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>

                                        {/* Generated Content Preview */}
                                        {message.generatedContent && (
                                            <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        {message.generatedContent.platform === 'instagram' ? (
                                                            <Instagram className="h-4 w-4 text-pink-500" />
                                                        ) : (
                                                            <Facebook className="h-4 w-4 text-blue-500" />
                                                        )}
                                                        <span className="text-sm font-medium capitalize">{message.generatedContent.platform}</span>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">Generated</Badge>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="text-sm leading-relaxed">{message.generatedContent.content}</div>

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
                                                        <div className="p-3 bg-background/50 rounded-lg">
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <Image className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-xs font-medium text-muted-foreground">Visual Brief</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{message.generatedContent.visualBrief}</p>
                                                        </div>
                                                    )}

                                                    {message.generatedContent.cta && (
                                                        <div className="p-3 bg-background/50 rounded-lg">
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <Target className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-xs font-medium text-muted-foreground">Call to Action</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{message.generatedContent.cta}</p>
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
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="max-w-3xl mr-12">
                                    <div className="bg-card border border-border rounded-2xl px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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

                {/* Input Area */}
                <div className="border-t border-border bg-card/50 backdrop-blur-sm">
                    <div className="px-6 py-4">
                        <div className="flex items-end space-x-3 max-w-4xl mx-auto">
                            <Button variant="ghost" size="sm" className="mb-2">
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 relative">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your content request... (e.g., 'Create a motivational post for Monday')"
                                    className="min-h-[44px] pr-12 bg-background border-border focus:border-primary resize-none"
                                    disabled={isTyping}
                                />
                            </div>
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="mb-2 bg-primary hover:bg-primary/90"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Quick Suggestions */}
                        <div className="mt-3 max-w-4xl mx-auto">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => setInput("Create a motivational Monday post")}
                                >
                                    🌟 Motivational Monday
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => setInput("Generate 5 posts for this week")}
                                >
                                    📅 Week's Content
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => setInput("Create a product launch announcement")}
                                >
                                    🚀 Product Launch
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => setInput("Schedule a behind-the-scenes post for tomorrow")}
                                >
                                    🎬 Behind the Scenes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}