import { parse } from 'date-fns'

interface ScheduleParseResult {
    success: boolean
    datetime?: Date
    error?: string
    confidence: number
    interpretation: string
}

export class NaturalLanguageScheduler {
    private static readonly TIME_PATTERNS = {
        // Relative times
        'in (\\\\d+) (minute|minutes|min|mins)': (match: RegExpMatchArray) => {
            const minutes = parseInt(match[1])
            return new Date(Date.now() + minutes * 60 * 1000)
        },
        'in (\\\\d+) (hour|hours|hr|hrs)': (match: RegExpMatchArray) => {
            const hours = parseInt(match[1])
            return new Date(Date.now() + hours * 60 * 60 * 1000)
        },
        'in (\\\\d+) (day|days)': (match: RegExpMatchArray) => {
            const days = parseInt(match[1])
            return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        },
        'in (\\\\d+) (week|weeks)': (match: RegExpMatchArray) => {
            const weeks = parseInt(match[1])
            return new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000)
        },

        // Specific times today
        'at (\\\\d{1,2}):(\\\\d{2})\\\\s*(am|pm|AM|PM)?': (match: RegExpMatchArray) => {
            const hour = parseInt(match[1])
            const minute = parseInt(match[2])
            const ampm = match[3]?.toLowerCase()

            let adjustedHour = hour
            if (ampm === 'pm' && hour !== 12) adjustedHour += 12
            if (ampm === 'am' && hour === 12) adjustedHour = 0

            const today = new Date()
            today.setHours(adjustedHour, minute, 0, 0)

            // If time has passed today, schedule for tomorrow
            if (today <= new Date()) {
                today.setDate(today.getDate() + 1)
            }

            return today
        },

        // Named days
        '(tomorrow|tmrw)': () => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(9, 0, 0, 0) // Default to 9 AM
            return tomorrow
        },

        '(monday|mon)': () => this.getNextWeekday(1),
        '(tuesday|tue|tues)': () => this.getNextWeekday(2),
        '(wednesday|wed)': () => this.getNextWeekday(3),
        '(thursday|thu|thurs)': () => this.getNextWeekday(4),
        '(friday|fri)': () => this.getNextWeekday(5),
        '(saturday|sat)': () => this.getNextWeekday(6),
        '(sunday|sun)': () => this.getNextWeekday(0),

        // Time + Day combinations
        '(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\\\s+at\\\\s+(\\\\d{1,2}):(\\\\d{2})\\\\s*(am|pm)?': (match: RegExpMatchArray) => {
            const dayName = match[1].toLowerCase()
            const hour = parseInt(match[2])
            const minute = parseInt(match[3])
            const ampm = match[4]?.toLowerCase()

            const dayMap: { [key: string]: number } = {
                monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
                friday: 5, saturday: 6, sunday: 0
            }

            let adjustedHour = hour
            if (ampm === 'pm' && hour !== 12) adjustedHour += 12
            if (ampm === 'am' && hour === 12) adjustedHour = 0

            const targetDay = dayMap[dayName]
            const date = this.getNextWeekday(targetDay)
            date.setHours(adjustedHour, minute, 0, 0)

            return date
        },

        // Specific dates
        '(\\\\d{1,2})/(\\\\d{1,2})/(\\\\d{4})': (match: RegExpMatchArray) => {
            const month = parseInt(match[1]) - 1 // JS months are 0-indexed
            const day = parseInt(match[2])
            const year = parseInt(match[3])
            return new Date(year, month, day, 9, 0, 0, 0)
        },

        '(\\\\d{4})-(\\\\d{2})-(\\\\d{2})': (match: RegExpMatchArray) => {
            const year = parseInt(match[1])
            const month = parseInt(match[2]) - 1
            const day = parseInt(match[3])
            return new Date(year, month, day, 9, 0, 0, 0)
        },

        // Special times
        '(now|immediately|asap)': () => new Date(),

        '(this evening|tonight)': () => {
            const today = new Date()
            today.setHours(19, 0, 0, 0) // 7 PM
            if (today <= new Date()) {
                today.setDate(today.getDate() + 1)
            }
            return today
        },

        '(this morning)': () => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(8, 0, 0, 0) // 8 AM
            return tomorrow
        },

        '(this afternoon)': () => {
            const today = new Date()
            today.setHours(14, 0, 0, 0) // 2 PM
            if (today <= new Date()) {
                today.setDate(today.getDate() + 1)
            }
            return today
        },

        '(next week)': () => {
            const nextWeek = new Date()
            nextWeek.setDate(nextWeek.getDate() + 7)
            nextWeek.setHours(9, 0, 0, 0)
            return nextWeek
        },

        '(next month)': () => {
            const nextMonth = new Date()
            nextMonth.setMonth(nextMonth.getMonth() + 1)
            nextMonth.setDate(1)
            nextMonth.setHours(9, 0, 0, 0)
            return nextMonth
        }
    }

    static parseSchedule(input: string): ScheduleParseResult {
        const normalizedInput = input.toLowerCase().trim()

        // Try each pattern
        for (const [pattern, handler] of Object.entries(this.TIME_PATTERNS)) {
            const regex = new RegExp(pattern, 'i')
            const match = normalizedInput.match(regex)

            if (match) {
                try {
                    const datetime = handler(match)

                    // Validate the date is in the future
                    if (datetime <= new Date()) {
                        // For past times, try to interpret as next occurrence
                        if (pattern.includes('at')) {
                            datetime.setDate(datetime.getDate() + 1)
                        }
                    }

                    return {
                        success: true,
                        datetime,
                        confidence: this.calculateConfidence(pattern, match),
                        interpretation: this.generateInterpretation(datetime)
                    }
                } catch (error) {
                    console.error('Date parsing error:', error)
                }
            }
        }

        // Try using date-fns for more complex parsing
        try {
            const parsed = parse(input, 'yyyy-MM-dd HH:mm', new Date())
            if (!isNaN(parsed.getTime()) && parsed > new Date()) {
                return {
                    success: true,
                    datetime: parsed,
                    confidence: 0.7,
                    interpretation: this.generateInterpretation(parsed)
                }
            }
        } catch (error) {
            // Ignore date-fns parsing errors
        }

        return {
            success: false,
            error: 'Could not parse the schedule time. Try formats like \"tomorrow at 3pm\", \"in 2 hours\", or \"monday at 9:30am\"',
            confidence: 0,
            interpretation: 'Unable to parse'
        }
    }

    private static getNextWeekday(targetDay: number): Date {
        const today = new Date()
        const currentDay = today.getDay()

        let daysUntilTarget = targetDay - currentDay
        if (daysUntilTarget <= 0) {
            daysUntilTarget += 7 // Next week
        }

        const targetDate = new Date(today)
        targetDate.setDate(today.getDate() + daysUntilTarget)
        targetDate.setHours(9, 0, 0, 0) // Default to 9 AM

        return targetDate
    }

    private static calculateConfidence(pattern: string, match: RegExpMatchArray): number {
        // Higher confidence for more specific patterns
        if (pattern.includes('\\\\d{4}-\\\\d{2}-\\\\d{2}')) return 0.95 // ISO date format
        if (pattern.includes('at') && pattern.includes('\\\\d{1,2}:\\\\d{2}')) return 0.9 // Specific time
        if (pattern.includes('\\\\d+') && pattern.includes('(hour|minute|day)')) return 0.85 // Relative time
        if (pattern.includes('(monday|tuesday|wednesday)')) return 0.8 // Named days
        if (pattern.includes('(tomorrow|tonight)')) return 0.75 // Named times

        return 0.6 // Default confidence
    }

    private static generateInterpretation(datetime: Date): string {
        const now = new Date()
        const diffMs = datetime.getTime() - now.getTime()
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMinutes / 60)
        const diffDays = Math.floor(diffHours / 24)

        const timeStr = datetime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })

        const dateStr = datetime.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        })

        if (diffMinutes < 60) {
            return `In ${diffMinutes} minutes (${timeStr})`
        } else if (diffHours < 24) {
            return `In ${diffHours} hours (${timeStr})`
        } else if (diffDays === 1) {
            return `Tomorrow at ${timeStr}`
        } else if (diffDays < 7) {
            return `${dateStr} at ${timeStr}`
        } else {
            return `${dateStr} at ${timeStr}`
        }
    }

    // Get scheduling suggestions
    static getSchedulingSuggestions(): string[] {
        return [
            'in 30 minutes',
            'in 2 hours',
            'tomorrow at 9am',
            'monday at 3pm',
            'this evening',
            'next week',
            'friday at 5:30pm',
            '2024-12-25 10:00'
        ]
    }

    // Validate if a datetime is reasonable for scheduling
    static validateScheduleTime(datetime: Date): { valid: boolean; reason?: string } {
        const now = new Date()
        const maxFuture = new Date()
        maxFuture.setFullYear(maxFuture.getFullYear() + 1) // Max 1 year in future

        if (datetime <= now) {
            return {
                valid: false,
                reason: 'Schedule time must be in the future'
            }
        }

        if (datetime > maxFuture) {
            return {
                valid: false,
                reason: 'Schedule time cannot be more than 1 year in the future'
            }
        }

        return { valid: true }
    }
}

export default NaturalLanguageScheduler