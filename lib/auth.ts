import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

export interface AuthUser {
    id: string
    email: string
    name?: string
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    )
}

export function verifyToken(token: string): AuthUser | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser
        return decoded
    } catch (error) {
        return null
    }
}

export function getAuthUser(request: NextRequest): AuthUser | null {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.substring(7)
    return verifyToken(token)
}

export function createAuthResponse(message: string, status: number = 401) {
    return Response.json({ error: message }, { status })
}