import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../db';

const GOOGLE_CLIENT = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string;
  avatar_url: string | null;
  oauth_provider: string | null;
  oauth_id: string | null;
  created_at: Date;
  updated_at: Date;
}

function generateAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

function generateRefreshToken(): string {
  return uuidv4() + '-' + uuidv4();
}

async function createSession(userId: string): Promise<string> {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  await pool.query(
    'INSERT INTO sessions (id, user_id, refresh_token, expires_at) VALUES ($1, $2, $3, $4)',
    [uuidv4(), userId, refreshToken, expiresAt]
  );
  return refreshToken;
}

function sanitizeUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    oauth_provider: user.oauth_provider,
    created_at: user.created_at,
  };
}

async function upsertOAuthUser(params: {
  email: string;
  display_name: string;
  avatar_url: string | null;
  oauth_provider: string;
  oauth_id: string;
}): Promise<UserRow> {
  const { email, display_name, avatar_url, oauth_provider, oauth_id } = params;

  const existing = await pool.query<UserRow>(
    'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
    [oauth_provider, oauth_id]
  );
  if (existing.rows.length > 0) {
    const updated = await pool.query<UserRow>(
      'UPDATE users SET email = $1, display_name = $2, avatar_url = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [email, display_name, avatar_url, existing.rows[0].id]
    );
    return updated.rows[0];
  }

  const byEmail = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
  if (byEmail.rows.length > 0) {
    const updated = await pool.query<UserRow>(
      'UPDATE users SET oauth_provider = $1, oauth_id = $2, avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id = $4 RETURNING *',
      [oauth_provider, oauth_id, avatar_url, byEmail.rows[0].id]
    );
    return updated.rows[0];
  }

  const inserted = await pool.query<UserRow>(
    'INSERT INTO users (id, email, display_name, avatar_url, oauth_provider, oauth_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [uuidv4(), email, display_name, avatar_url, oauth_provider, oauth_id]
  );
  return inserted.rows[0];
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password, display_name } = request.body as { email: string; password: string; display_name: string };
    if (!email || !password || !display_name) {
      return reply.code(400).send({ error: 'email, password and display_name are required' });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters' });
    }
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return reply.code(409).send({ error: 'Email already in use' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query<UserRow>(
      'INSERT INTO users (id, email, password_hash, display_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuidv4(), email.toLowerCase(), password_hash, display_name]
    );
    const user = result.rows[0];
    const access_token = generateAccessToken(user.id);
    const refresh_token = await createSession(user.id);
    reply.setCookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * REFRESH_TOKEN_EXPIRES_DAYS,
    });
    return reply.code(201).send({ access_token, refresh_token, user: sanitizeUser(user) });
  });

  fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as { email: string; password: string };
    if (!email || !password) {
      return reply.code(400).send({ error: 'email and password are required' });
    }
    const result = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (!user.password_hash) {
      return reply.code(401).send({ error: 'This account uses social login. Please sign in with Google or Yandex.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    const access_token = generateAccessToken(user.id);
    const refresh_token = await createSession(user.id);
    reply.setCookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * REFRESH_TOKEN_EXPIRES_DAYS,
    });
    return reply.send({ access_token, refresh_token, user: sanitizeUser(user) });
  });

  fastify.post('/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const bodyToken = (request.body as { refresh_token?: string })?.refresh_token;
    const cookieToken = (request.cookies as Record<string, string>)?.refresh_token;
    const refresh_token = bodyToken || cookieToken;
    if (!refresh_token) {
      return reply.code(401).send({ error: 'Refresh token required' });
    }
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > NOW()',
      [refresh_token]
    );
    if (sessionResult.rows.length === 0) {
      return reply.code(401).send({ error: 'Invalid or expired refresh token' });
    }
    const session = sessionResult.rows[0];
    const access_token = generateAccessToken(session.user_id);
    return reply.send({ access_token });
  });

  fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const bodyToken = (request.body as { refresh_token?: string })?.refresh_token;
    const cookieToken = (request.cookies as Record<string, string>)?.refresh_token;
    const refresh_token = bodyToken || cookieToken;
    if (refresh_token) {
      await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refresh_token]);
    }
    reply.clearCookie('refresh_token', { path: '/' });
    return reply.send({ success: true });
  });

  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Authorization header required' });
    }
    const token = authHeader.slice(7);
    let payload: { sub: string; type: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as { sub: string; type: string };
    } catch {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
    if (payload.type !== 'access') {
      return reply.code(401).send({ error: 'Invalid token type' });
    }
    const result = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }
    return reply.send({ user: sanitizeUser(result.rows[0]) });
  });

  fastify.post('/auth/google', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id_token } = request.body as { id_token: string };
    if (!id_token) {
      return reply.code(400).send({ error: 'id_token is required' });
    }
    let ticket;
    try {
      ticket = await GOOGLE_CLIENT.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      return reply.code(401).send({ error: 'Invalid Google token' });
    }
    const googlePayload = ticket.getPayload();
    if (!googlePayload || !googlePayload.email) {
      return reply.code(401).send({ error: 'Failed to get user info from Google token' });
    }
    const user = await upsertOAuthUser({
      email: googlePayload.email,
      display_name: googlePayload.name || googlePayload.email.split('@')[0],
      avatar_url: googlePayload.picture || null,
      oauth_provider: 'google',
      oauth_id: googlePayload.sub,
    });
    const access_token = generateAccessToken(user.id);
    const refresh_token = await createSession(user.id);
    reply.setCookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * REFRESH_TOKEN_EXPIRES_DAYS,
    });
    return reply.send({ access_token, refresh_token, user: sanitizeUser(user) });
  });

  // Yandex OAuth — redirect to Yandex
  fastify.get('/auth/yandex', async (_request: FastifyRequest, reply: FastifyReply) => {
    const clientId = process.env.YANDEX_CLIENT_ID;
    const redirectUri = process.env.YANDEX_REDIRECT_URI || 'https://threadline.tigerapps.pro/api/auth/yandex/callback';
    if (!clientId) {
      return reply.code(500).send({ error: 'Yandex OAuth not configured' });
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      force_confirm: 'no',
    });
    return reply.redirect(302, 'https://oauth.yandex.ru/authorize?' + params.toString());
  });

  // Yandex OAuth — callback
  fastify.get('/auth/yandex/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    const { code, error } = request.query as { code?: string; error?: string };
    if (error || !code) {
      return reply.redirect(302, FRONTEND_URL + '/login?error=yandex_denied');
    }
    const clientId = process.env.YANDEX_CLIENT_ID;
    const clientSecret = process.env.YANDEX_CLIENT_SECRET;
    const redirectUri = process.env.YANDEX_REDIRECT_URI || 'https://threadline.tigerapps.pro/api/auth/yandex/callback';
    if (!clientId || !clientSecret) {
      return reply.redirect(302, FRONTEND_URL + '/login?error=yandex_not_configured');
    }

    // Exchange code for token
    let tokenData: { access_token?: string; error?: string };
    try {
      const tokenRes = await fetch('https://oauth.yandex.ru/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }).toString(),
      });
      tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    } catch {
      return reply.redirect(302, FRONTEND_URL + '/login?error=yandex_token_exchange_failed');
    }

    if (!tokenData.access_token) {
      return reply.redirect(302, FRONTEND_URL + '/login?error=yandex_no_token');
    }

    // Get user info from Yandex
    let yandexUser: { id: string; default_email?: string; real_name?: string; display_name?: string; default_avatar_id?: string };
    try {
      const userRes = await fetch('https://login.yandex.ru/info?format=json', {
        headers: { Authorization: 'OAuth ' + tokenData.access_token },
      });
      yandexUser = await userRes.json() as typeof yandexUser;
    } catch {
      return reply.redirect(302, FRONTEND_URL + '/login?error=yandex_userinfo_failed');
    }

    const email = yandexUser.default_email;
    if (!email) {
      return reply.redirect(302, FRONTEND_URL + '/login?error=yandex_no_email');
    }

    const avatarUrl = yandexUser.default_avatar_id
      ? 'https://avatars.yandex.net/get-yapic/' + yandexUser.default_avatar_id + '/islands-200'
      : null;

    const user = await upsertOAuthUser({
      email,
      display_name: yandexUser.real_name || yandexUser.display_name || email.split('@')[0],
      avatar_url: avatarUrl,
      oauth_provider: 'yandex',
      oauth_id: yandexUser.id,
    });

    const access_token = generateAccessToken(user.id);
    const refresh_token = await createSession(user.id);

    reply.setCookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * REFRESH_TOKEN_EXPIRES_DAYS,
    });

    // Redirect back to frontend with tokens
    const redirectParams = new URLSearchParams({ access_token, refresh_token });
    return reply.redirect(302, FRONTEND_URL + '/login/callback?' + redirectParams.toString());
  });
}
