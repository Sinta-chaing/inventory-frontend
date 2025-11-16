"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setNeedsConfirmation(false)
    setResendSuccess(false)

    console.log("[v0] Attempting login with email:", email)
    console.log("[v0] Supabase URL configured:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] Supabase Anon Key configured:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Login response:", JSON.stringify(data))

      if (error) {
        console.log("[v0] Login error:", error.message)
        throw error
      }

      console.log("[v0] Login successful, redirecting to homepage")
      setLoginSuccess(true)
      setTimeout(() => {
        window.location.href = "/"
      }, 1500)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"

      if (errorMessage.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please check your credentials and try again.")
      } else if (errorMessage.includes("Email not confirmed")) {
        setError("Please confirm your email address before logging in. Check your inbox for the confirmation link.")
        setNeedsConfirmation(true)
      } else {
        setError(errorMessage)
      }
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address first")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/`,
        },
      })

      if (error) throw error

      setResendSuccess(true)
      setError(null)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to resend confirmation email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                    {error}
                    {needsConfirmation && (
                      <Button
                        type="button"
                        variant="link"
                        className="mt-2 h-auto p-0 text-red-800 underline"
                        onClick={handleResendConfirmation}
                        disabled={isLoading}
                      >
                        Resend confirmation email
                      </Button>
                    )}
                  </div>
                )}
                {resendSuccess && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
                    Confirmation email sent! Please check your inbox and spam folder.
                  </div>
                )}
                {loginSuccess && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Login successful! Redirecting to homepage...</span>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading || loginSuccess}>
                  {isLoading ? "Logging in..." : loginSuccess ? "Success!" : "Login"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || loginSuccess}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Google
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
