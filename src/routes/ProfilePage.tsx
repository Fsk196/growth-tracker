import { useAuth } from '../features/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function ProfilePage() {
  const { session } = useAuth()
  const email = session?.user.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{email}</p>
            <p className="text-xs text-muted-foreground">
              Joined {session ? new Date(session.user.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
