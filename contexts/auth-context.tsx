\"use client\"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface User {
    id: string
    email: string
    name: string
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('auth_token')
        if (token) {
            // TODO: Validate token with API
            // For now, we'll just set loading to false
        }
        setIsLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const response = await apiClient.login({ email, password })
            setUser(response.user)
        } catch (error) {
            throw error
        }
    }

    const register = async (name: string, email: string, password: string) => {
        try {
            const response = await apiClient.register({ name, email, password })
            setUser(response.user)
        } catch (error) {
            throw error
        }
    }

    const logout = () => {
        apiClient.clearToken()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}