
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, fullName, role, specialty, clinicName, phoneNumber } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate doctor-specific fields
    if (role === 'doctor' && (!email || !specialty || !clinicName || !phoneNumber)) {
      return NextResponse.json(
        { error: 'Email, specialty, clinic name, and phone number are required for doctors' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Check if email already exists (for doctors)
    if (email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        return NextResponse.json(
          { error: 'User already exists with this email' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: any = {
      username,
      password: hashedPassword,
      fullName: fullName || null,
      role: role || 'patient',
    };

    // Add email for doctors
    if (email) {
      userData.email = email;
    }

    // Add doctor-specific fields if role is doctor
    if (role === 'doctor') {
      userData.specialty = specialty;
      userData.clinicName = clinicName;
      userData.phoneNumber = phoneNumber;
    }

    const user = await prisma.user.create({
      data: userData,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
