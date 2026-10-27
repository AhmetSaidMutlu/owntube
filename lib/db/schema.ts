import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const videos = pgTable('videos', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  videoId: text('videoId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnailUrl'),
  channelId: text('channelId'),
  channelTitle: text('channelTitle'),
  publishedAt: timestamp('publishedAt'),
  videoUrl: text('videoUrl'),
  isWatched: boolean('isWatched').notNull().default(false),
  watchedAt: timestamp('watchedAt'),
})

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  channelId: text('channelId').notNull(),
  channelTitle: text('channelTitle'),
  channelThumbnail: text('channelThumbnail'),
  isActive: boolean('isActive').notNull().default(true),
})

export const youtubeAccounts = pgTable('youtube_accounts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  expiresAt: timestamp('expiresAt'),
})

export const schema = { user, session, account, verification, videos, subscriptions, youtubeAccounts }
export type AppSchema = typeof schema

export default schema

export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type YoutubeAccount = typeof youtubeAccounts.$inferSelect

export const tables = { videos, subscriptions, youtubeAccounts }

export type AuthUser = typeof user.$inferSelect

export const authTables = { user, session, account, verification }
