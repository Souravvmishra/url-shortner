import { firestore } from '@/services/firebase'
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function RedirectPage({ params }: Props) {
  let redirectPath: string | null = null

  const { id } = await params

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
          <div className="text-red-600 text-center" role="alert">
            <p className="text-xl font-semibold mb-2">Error</p>
            <p>Invalid URL</p>
          </div>
        </div>
      </div>
    )
  }

  try {
    // Query for the URL document
    const urlsRef = collection(firestore, 'urls')
    const q = query(urlsRef, where('shortUrl', '==', id))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
            <div className="text-red-600 text-center" role="alert">
              <p className="text-xl font-semibold mb-2">Error</p>
              <p>URL not found</p>
            </div>
          </div>
        </div>
      )
    }

    const doc = querySnapshot.docs[0]
    const urlData = doc.data()

    // Validate URL
    if (!urlData.longUrl || typeof urlData.longUrl !== 'string') {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
            <div className="text-red-600 text-center" role="alert">
              <p className="text-xl font-semibold mb-2">Error</p>
              <p>Invalid destination URL</p>
            </div>
          </div>
        </div>
      )
    }

    // Update click count
    try {
      await updateDoc(doc.ref, {
        clicks: (urlData.clicks || 0) + 1,
        lastAccessed: new Date().toISOString()
      })
    } catch (updateErr) {
      console.error('Failed to update click count:', updateErr)
    }

    redirectPath = urlData.longUrl

  } catch (err) {
    console.error('Redirect error:', err)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
          <div className="text-red-600 text-center" role="alert">
            <p className="text-xl font-semibold mb-2">Error</p>
            <p>Something went wrong. Please try again later.</p>
          </div>
        </div>
      </div>
    )
  } finally {
    if (redirectPath) {
      redirect(redirectPath)
    }
  }
}
