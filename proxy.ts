import { NextResponse, type NextRequest } from 'next/server'

// Geliştirmede mobil uygulamanın tarayıcı sürümü (expo web) farklı porttan /api/* çağırır.
const DEV_CORS_ORIGINS = process.env.NODE_ENV === 'development' ? ['http://localhost:8081'] : []

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin || !DEV_CORS_ORIGINS.includes(origin) || !request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': request.headers.get('access-control-request-headers') ?? 'Content-Type',
    Vary: 'Origin',
  }
  if (request.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers: cors })
  const response = NextResponse.next()
  for (const [key, value] of Object.entries(cors)) response.headers.set(key, value)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
