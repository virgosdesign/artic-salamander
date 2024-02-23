import { defineMiddleware } from 'astro:middleware';
import { lucia } from '~/auth';
import { verifyRequestOrigin } from 'lucia';

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.request.method !== 'GET') {
    console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& POST', context);
    const originHeader = context.request.headers.get('Origin');
    const hostHeader = context.request.headers.get('Host');
    if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
      return new Response(null, {
        status: 403,
      });
    }
  }

  console.log("PATHNAME>>>>>>>>>: ", context.url.pathname)
  if (context.url?.pathname === '/' || context.url?.pathname === '/login' || context.url?.pathname === '/signup' || context.url?.pathname === '/logout' || context.url?.pathname === '/api/login' || context.url?.pathname === '/api/signup' || context.url?.pathname === '/api/logout' || context.url?.pathname === '/api/user' || context.url?.pathname === '/api/session' || context.url?.pathname === '/api/refresh' || context.url?.pathname === '/api/verify') {
    console.log("UNPROTECTED ROUTE: ", context.url?.pathname)
    return next();
  }

  const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }
  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  }
  context.locals.session = session;
  context.locals.user = user;
  return next();
});
