"use client"

import React, { useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { firestore } from '@/services/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowUpRight, CopyIcon, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/firebaseProvider'
import { auth } from '@/services/firebase'
import { signOut } from 'firebase/auth'

interface UrlDoc {
  id: string;
  longUrl: string;
  shortUrl: string;
  createdAt: string;
  clicks: number;
  userId: string | undefined;
}

const Page = () => {
  const [longUrl, setLongUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userUrls, setUserUrls] = useState<UrlDoc[]>([])
  const { user } = useAuth()

  useEffect(() => {
    const fetchUserUrls = async () => {
      if (!user) return
      
      const urlsRef = collection(firestore, 'urls')
      const q = query(urlsRef, where('userId', '==', user.uid))
      const querySnapshot = await getDocs(q)
      const urls = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<UrlDoc, 'id'>)
      }))
      setUserUrls(urls)
    }

    fetchUserUrls()
  }, [user])

  const generateShortUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!longUrl) {
        throw new Error('Please enter a URL')
      }

      // Validate URL format
      try {
        new URL(longUrl)
      } catch {
        throw new Error('Please enter a valid URL')
      }

      const urlId = nanoid(6)
      const shortUrlDoc = {
        longUrl,
        shortUrl: urlId,
        createdAt: new Date().toISOString(),
        clicks: 0,
        userId: user?.uid
      }

      const docRef = await addDoc(collection(firestore, 'urls'), shortUrlDoc)
      const newShortUrl = `${window.location.origin}/${urlId}`
      setShortUrl(newShortUrl)
      setUserUrls(prev => [...prev, { id: docRef.id, ...shortUrlDoc }])
      toast.success('URL shortened successfully!')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
        toast.error(err.message)
      } else {
        setError('Something went wrong')
        toast.error('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('Logged out successfully')
    } catch {
      toast.error('Failed to logout')
    }
  }

  return (
    <div className="container flex flex-col items-center min-h-screen py-8">
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        {user && (
          <>
            <div className="flex items-center gap-2">
              {user.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </>
        )}
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>URL Shortener</CardTitle>
          <CardDescription>
            Create short and memorable links in seconds
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={generateShortUrl} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="longUrl">Enter your long URL</Label>
              <Input
                type="url"
                id="longUrl"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="https://example.com/very-long-url"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Short URL'}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {shortUrl && (
            <div className="mt-6 space-y-2">
              <Label>Your shortened URL</Label>
              <div className="flex space-x-2">
                <Input
                  readOnly
                  value={shortUrl}
                  className="bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(shortUrl)
                    toast.success('URL copied to clipboard!')
                  }}
                  title="Copy to clipboard"
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(shortUrl, '_blank')}
                  title="Go to URL"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {userUrls.length > 0 && (
        <Card className="w-full max-w-md mt-8">
          <CardHeader>
            <CardTitle>Your URLs</CardTitle>
            <CardDescription>
              All your shortened URLs in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userUrls.map((url) => {
                const fullShortUrl = `${window.location.origin}/${url.shortUrl}`
                return (
                  <div key={url.id} className="p-4 border rounded-lg">
                    <p className="text-sm font-medium truncate">{url.longUrl}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground">
                          {fullShortUrl}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(fullShortUrl)
                            toast.success('URL copied to clipboard!')
                          }}
                          title="Copy to clipboard"
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(fullShortUrl, '_blank')}
                          title="Go to URL"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Clicks: {url.clicks}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Page
