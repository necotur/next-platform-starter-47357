
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password are required');
        }

        // Check if input is an email (contains @)
        const isEmail = credentials.username.includes('@');
        
        let user;
        if (isEmail) {
          // Try to find user by email
          user = await prisma.user.findUnique({
            where: { email: credentials.username },
          });
        } else {
          // Try to find user by username
          user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });
        }

        if (!user) {
          throw new Error(isEmail ? 'No user found with this email' : 'No user found with this username');
        }

        // Check if one-time password is being used
        if (
          user.oneTimePassword &&
          !user.oneTimePasswordUsed &&
          user.oneTimePasswordExpires &&
          new Date(user.oneTimePasswordExpires) > new Date()
        ) {
          const isValidOneTimePassword = await bcrypt.compare(
            credentials.password,
            user.oneTimePassword
          );

          if (isValidOneTimePassword) {
            // Mark one-time password as used
            await prisma.user.update({
              where: { id: user.id },
              data: {
                oneTimePasswordUsed: true,
              },
            });

            return {
              id: user.id,
              email: user.email || '',
              name: user.fullName,
              requirePasswordChange: true,
            };
          }
        }

        // Check regular password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email || '',
          name: user.fullName,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.requirePasswordChange = (user as any).requirePasswordChange;
      }
      // Fetch latest user data from database (role and fullName)
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, fullName: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.fullName;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).requirePasswordChange = token.requirePasswordChange;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
