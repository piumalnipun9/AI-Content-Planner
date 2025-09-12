"use client"

import { useState } from "react"
import { Settings, User, Link as LinkIcon, Bell, Shield, Palette, Facebook, Instagram, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
    const [connectedAccounts, setConnectedAccounts] = useState({
        facebook: { connected: true, username: '@yourbusiness', userId: 'fb_123456' },
        instagram: { connected: true, username: '@yourbusiness', userId: 'ig_789012' },
    })

    const [notifications, setNotifications] = useState({
        postPublished: true,
        postFailed: true,
        dailyReports: false,
        weeklyReports: true,
    })

    const [preferences, setPreferences] = useState({
        defaultTone: 'professional',
        targetAudience: 'business professionals',
        defaultSchedulingTime: '09:00',
        timeZone: 'America/New_York',
    })

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-lg">
                            <Settings className="h-6 w-6 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
                            <p className="text-muted-foreground">Manage your account and AI preferences</p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="accounts" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 h-12 bg-card border border-border">
                        <TabsTrigger value="accounts" className="h-10 font-medium">
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Accounts
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="h-10 font-medium">
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="h-10 font-medium">
                            <Bell className="h-4 w-4 mr-2" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="h-10 font-medium">
                            <Palette className="h-4 w-4 mr-2" />
                            AI Preferences
                        </TabsTrigger>
                    </TabsList>

                    {/* Connected Accounts */}
                    <TabsContent value="accounts" className="space-y-6">
                        <Card className="border border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-foreground">Connected Social Media Accounts</CardTitle>
                                <p className="text-muted-foreground">Connect your social media accounts to start posting and scheduling content.</p>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* Facebook */}
                                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-600 rounded-lg">
                                            <Facebook className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">Facebook</h3>
                                            {connectedAccounts.facebook.connected ? (
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground">Connected as {connectedAccounts.facebook.username}</p>
                                                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Connected
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Not connected</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        {connectedAccounts.facebook.connected ? (
                                            <Button
                                                variant="outline"
                                                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                                                onClick={() => setConnectedAccounts(prev => ({
                                                    ...prev,
                                                    facebook: { ...prev.facebook, connected: false }
                                                }))}
                                            >
                                                Disconnect
                                            </Button>
                                        ) : (
                                            <Button
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => setConnectedAccounts(prev => ({
                                                    ...prev,
                                                    facebook: { ...prev.facebook, connected: true }
                                                }))}
                                            >
                                                Connect Facebook
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Instagram */}
                                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                            <Instagram className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">Instagram</h3>
                                            {connectedAccounts.instagram.connected ? (
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground">Connected as {connectedAccounts.instagram.username}</p>
                                                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Connected
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Not connected</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        {connectedAccounts.instagram.connected ? (
                                            <Button
                                                variant="outline"
                                                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                                                onClick={() => setConnectedAccounts(prev => ({
                                                    ...prev,
                                                    instagram: { ...prev.instagram, connected: false }
                                                }))}
                                            >
                                                Disconnect
                                            </Button>
                                        ) : (
                                            <Button
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                                onClick={() => setConnectedAccounts(prev => ({
                                                    ...prev,
                                                    instagram: { ...prev.instagram, connected: true }
                                                }))}
                                            >
                                                Connect Instagram
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Account Requirements</h4>
                                    <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                                        <li>• Your accounts must be business accounts to use scheduling features</li>
                                        <li>• Instagram requires connection through Facebook Business Manager</li>
                                        <li>• All permissions are used only for posting and analytics</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Profile Settings */}
                    <TabsContent value="profile" className="space-y-6">
                        <Card className="border border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-foreground">Profile Information</CardTitle>
                                <p className="text-muted-foreground">Update your account details and business information.</p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" defaultValue="John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" defaultValue="john@yourbusiness.com" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="business">Business Name</Label>
                                    <Input id="business" defaultValue="Your Business" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Business Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Brief description of your business..."
                                        defaultValue="We help businesses grow through innovative social media strategies."
                                        className="min-h-[100px]"
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-foreground">Account Security</h3>
                                    <Button variant="outline" className="border-border hover:bg-secondary">
                                        <Shield className="h-4 w-4 mr-2" />
                                        Change Password
                                    </Button>
                                </div>

                                <div className="flex justify-end">
                                    <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications */}
                    <TabsContent value="notifications" className="space-y-6">
                        <Card className="border border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-foreground">Notification Preferences</CardTitle>
                                <p className="text-muted-foreground">Choose what notifications you'd like to receive.</p>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-foreground">Post Notifications</h3>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Post Published</p>
                                            <p className="text-sm text-muted-foreground">Get notified when posts are successfully published</p>
                                        </div>
                                        <Switch
                                            checked={notifications.postPublished}
                                            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, postPublished: checked }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Post Failed</p>
                                            <p className="text-sm text-muted-foreground">Get notified when posts fail to publish</p>
                                        </div>
                                        <Switch
                                            checked={notifications.postFailed}
                                            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, postFailed: checked }))}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-foreground">Reports</h3>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Daily Reports</p>
                                            <p className="text-sm text-muted-foreground">Daily summary of your content performance</p>
                                        </div>
                                        <Switch
                                            checked={notifications.dailyReports}
                                            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, dailyReports: checked }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Weekly Reports</p>
                                            <p className="text-sm text-muted-foreground">Weekly summary and analytics insights</p>
                                        </div>
                                        <Switch
                                            checked={notifications.weeklyReports}
                                            onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button className="bg-primary hover:bg-primary/90">Save Preferences</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* AI Preferences */}
                    <TabsContent value="ai" className="space-y-6">
                        <Card className="border border-border bg-card">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-foreground">AI Content Preferences</CardTitle>
                                <p className="text-muted-foreground">Customize how AI generates content for your brand.</p>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="tone">Default Brand Tone</Label>
                                        <select
                                            id="tone"
                                            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                                            value={preferences.defaultTone}
                                            onChange={(e) => setPreferences(prev => ({ ...prev, defaultTone: e.target.value }))}
                                        >
                                            <option value="professional">Professional</option>
                                            <option value="casual">Casual</option>
                                            <option value="friendly">Friendly</option>
                                            <option value="energetic">Energetic</option>
                                            <option value="authoritative">Authoritative</option>
                                            <option value="playful">Playful</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="audience">Target Audience</Label>
                                        <Input
                                            id="audience"
                                            value={preferences.targetAudience}
                                            onChange={(e) => setPreferences(prev => ({ ...prev, targetAudience: e.target.value }))}
                                            placeholder="e.g., young professionals, fitness enthusiasts"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="schedule-time">Default Scheduling Time</Label>
                                        <Input
                                            id="schedule-time"
                                            type="time"
                                            value={preferences.defaultSchedulingTime}
                                            onChange={(e) => setPreferences(prev => ({ ...prev, defaultSchedulingTime: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Time Zone</Label>
                                        <select
                                            id="timezone"
                                            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                                            value={preferences.timeZone}
                                            onChange={(e) => setPreferences(prev => ({ ...prev, timeZone: e.target.value }))}
                                        >
                                            <option value="America/New_York">Eastern Time (ET)</option>
                                            <option value="America/Chicago">Central Time (CT)</option>
                                            <option value="America/Denver">Mountain Time (MT)</option>
                                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                            <option value="UTC">UTC</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">AI Tips</h4>
                                    <ul className="text-sm text-green-800 dark:text-green-400 space-y-1">
                                        <li>• The more specific your target audience, the better AI can tailor content</li>
                                        <li>• Brand tone affects writing style, emoji usage, and call-to-action phrases</li>
                                        <li>• AI learns from your feedback to improve future suggestions</li>
                                    </ul>
                                </div>

                                <div className="flex justify-end">
                                    <Button className="bg-primary hover:bg-primary/90">Save AI Preferences</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}